import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import {
  clearAccountSession,
  loadAccountSession,
  saveAccountSession,
  type StoredAccountSession,
} from "@/lib/auth/storage";
import { GoogleAuthBridge, shouldUseGoogleAuthBridge } from "@/lib/auth/GoogleAuthBridge";
import {
  configureNativeGoogleSignIn,
  signInWithGoogleNative,
} from "@/lib/auth/googleSignInNative";
import {
  getGoogleAuthClientConfig,
  isGoogleAuthConfigured,
} from "@/lib/auth/googleConfig";
import {
  loginWithApple,
  loginWithDev,
  loginWithGoogle,
  fetchMyProfiles,
  fetchAccount,
  acceptTerms as acceptTermsApi,
  deleteAccount as deleteAccountApi,
} from "@/lib/api/client";
import type { AccountProfileSummary, AccountPublicView } from "@/types/account";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  account: AccountPublicView | null;
  profiles: AccountProfileSummary[];
  isBootstrapping: boolean;
  isRefreshingProfiles: boolean;
  isGoogleAuthConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithDev: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountPublicView | null>(null);
  const [profiles, setProfiles] = useState<AccountProfileSummary[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshingProfiles, setIsRefreshingProfiles] = useState(false);
  const googlePromptRef = useRef<(() => Promise<unknown>) | null>(null);
  const googleAuthConfig = getGoogleAuthClientConfig();

  const applySession = useCallback(async (session: StoredAccountSession) => {
    await saveAccountSession(session);
    setAccount(session.account);
    setSessionToken(session.sessionToken);
  }, []);

  const refreshAccountFromServer = useCallback(async (token: string) => {
    const response = await fetchAccount(token);
    setAccount(response.account);
    const stored = await loadAccountSession();
    if (stored) {
      await saveAccountSession({
        ...stored,
        account: response.account,
      });
    }
    return response.account;
  }, []);

  const acceptTerms = useCallback(async () => {
    const stored = await loadAccountSession();
    const token = sessionToken ?? stored?.sessionToken;
    if (!token) {
      throw new Error("Sign in to accept the Terms & Conditions.");
    }

    const response = await acceptTermsApi(token);
    await applySession({
      account: response.account,
      sessionToken: token,
      expiresAt: stored?.expiresAt ?? Date.now() + 86_400_000,
    });
  }, [applySession, sessionToken]);

  const completeGoogleLogin = useCallback(
    async (idToken: string) => {
      const auth = await loginWithGoogle(idToken);
      await applySession({
        account: auth.account,
        sessionToken: auth.sessionToken,
        expiresAt: auth.expiresAt,
      });
      const response = await fetchMyProfiles(auth.sessionToken);
      setProfiles(response.profiles);
    },
    [applySession],
  );

  const registerGooglePrompt = useCallback((prompt: () => Promise<unknown>) => {
    googlePromptRef.current = prompt;
  }, []);

  const refreshProfiles = useCallback(async () => {
    const token = sessionToken ?? (await loadAccountSession())?.sessionToken;
    if (!token) {
      setProfiles([]);
      return;
    }

    setIsRefreshingProfiles(true);
    try {
      const response = await fetchMyProfiles(token);
      setProfiles(response.profiles);
    } finally {
      setIsRefreshingProfiles(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (Platform.OS === "android" && googleAuthConfig?.webClientId) {
      configureNativeGoogleSignIn(googleAuthConfig.webClientId);
    }
  }, [googleAuthConfig?.webClientId]);

  useEffect(() => {
    async function bootstrap() {
      const stored = await loadAccountSession();
      if (stored) {
        setAccount(stored.account);
        setSessionToken(stored.sessionToken);
        try {
          const account = await refreshAccountFromServer(stored.sessionToken);
          const response = await fetchMyProfiles(stored.sessionToken);
          setProfiles(response.profiles);
          setAccount(account);
        } catch {
          await clearAccountSession();
          setAccount(null);
          setSessionToken(null);
          setProfiles([]);
        }
      }
      setIsBootstrapping(false);
    }

    bootstrap();
  }, [refreshAccountFromServer]);

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured()) {
      throw new Error(
        "Google Sign-In is not configured. Use Dev Sign-In for local testing.",
      );
    }

    if (Platform.OS === "android") {
      const idToken = await signInWithGoogleNative();
      await completeGoogleLogin(idToken);
      return;
    }

    const prompt = googlePromptRef.current;
    if (!prompt) {
      throw new Error("Google Sign-In is still initializing. Try again.");
    }

    await prompt();
  }, [completeGoogleLogin]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      throw new Error("Apple Sign-In is available on iOS devices.");
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Apple Sign-In did not return an identity token.");
    }

    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(" ");

    const auth = await loginWithApple({
      identityToken: credential.identityToken,
      email: credential.email,
      fullName: fullName || null,
    });

    await applySession({
      account: auth.account,
      sessionToken: auth.sessionToken,
      expiresAt: auth.expiresAt,
    });
    const response = await fetchMyProfiles(auth.sessionToken);
    setProfiles(response.profiles);
  }, [applySession]);

  const signInWithDev = useCallback(async () => {
    const auth = await loginWithDev({
      provider: "google",
      displayName: "Dev Creator",
      email: `dev-${Date.now()}@getsuperstar.info`,
    });

    await applySession({
      account: auth.account,
      sessionToken: auth.sessionToken,
      expiresAt: auth.expiresAt,
    });
    const response = await fetchMyProfiles(auth.sessionToken);
    setProfiles(response.profiles);
  }, [applySession]);

  const signOut = useCallback(async () => {
    await clearAccountSession();
    setAccount(null);
    setSessionToken(null);
    setProfiles([]);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!sessionToken) {
      throw new Error("Sign in to delete your account.");
    }

    await deleteAccountApi(sessionToken);
    await signOut();
  }, [sessionToken, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      profiles,
      isBootstrapping,
      isRefreshingProfiles,
      isGoogleAuthConfigured: isGoogleAuthConfigured(),
      signInWithGoogle,
      signInWithApple,
      signInWithDev,
      signOut,
      deleteAccount,
      refreshProfiles,
      acceptTerms,
      sessionToken,
    }),
    [
      account,
      profiles,
      isBootstrapping,
      isRefreshingProfiles,
      signInWithGoogle,
      signInWithApple,
      signInWithDev,
      signOut,
      deleteAccount,
      refreshProfiles,
      acceptTerms,
      sessionToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {googleAuthConfig && shouldUseGoogleAuthBridge() ? (
        <GoogleAuthBridge
          config={googleAuthConfig}
          onIdToken={completeGoogleLogin}
          onPromptReady={registerGooglePrompt}
        />
      ) : null}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}

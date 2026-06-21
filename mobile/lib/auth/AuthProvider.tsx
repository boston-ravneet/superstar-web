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
import { GoogleAuthBridge } from "@/lib/auth/GoogleAuthBridge";
import {
  getGoogleAuthClientConfig,
  isGoogleAuthConfigured,
} from "@/lib/auth/googleConfig";
import {
  loginWithApple,
  loginWithDev,
  loginWithGoogle,
  fetchMyProfiles,
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
  refreshProfiles: () => Promise<void>;
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
    async function bootstrap() {
      const stored = await loadAccountSession();
      if (stored) {
        setAccount(stored.account);
        setSessionToken(stored.sessionToken);
        try {
          const response = await fetchMyProfiles(stored.sessionToken);
          setProfiles(response.profiles);
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
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured()) {
      throw new Error(
        "Google Sign-In is not configured. Use Dev Sign-In for local testing.",
      );
    }

    const prompt = googlePromptRef.current;
    if (!prompt) {
      throw new Error("Google Sign-In is still initializing. Try again.");
    }

    await prompt();
  }, []);

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
      refreshProfiles,
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
      refreshProfiles,
      sessionToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {googleAuthConfig ? (
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

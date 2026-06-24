"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SuperstarLogoFull } from "@/components/brand/SuperstarLogo";

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

const actionButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-full border px-7 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45";

export function LandingClaimHero({ tagline }: { tagline: string }) {
  const searchParams = useSearchParams();
  const initialHandle = searchParams.get("handle") ?? "";

  const [handle, setHandle] = useState(initialHandle);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const normalized = normalizeHandle(handle);

  const runCheck = useCallback(async (value: string) => {
    if (!value) {
      setCheckState("idle");
      setMessage(null);
      return;
    }

    setCheckState("checking");
    setMessage(null);

    try {
      const response = await fetch(
        `/api/profile/check?username=${encodeURIComponent(value)}`,
      );
      const data = (await response.json()) as {
        available?: boolean;
        reason?: string;
        username?: string;
      };

      if (data.available) {
        setCheckState("available");
        setMessage(
          `@${data.username ?? value} is available. Open the Superstar app to claim it.`,
        );
        return;
      }

      setCheckState(data.reason ? "invalid" : "taken");
      setMessage(data.reason ?? "This handle is already taken.");
    } catch {
      setCheckState("invalid");
      setMessage("Unable to check this handle right now.");
    }
  }, []);

  useEffect(() => {
    if (!normalized) {
      setCheckState("idle");
      setMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      runCheck(normalized);
    }, 400);

    return () => clearTimeout(timer);
  }, [normalized, runCheck]);

  const inputBorder =
    checkState === "available"
      ? "border-emerald-500 ring-2 ring-emerald-500/20"
      : checkState === "taken" || checkState === "invalid"
        ? "border-red-400 ring-2 ring-red-400/15"
        : "border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

  return (
    <section
      id="claim"
      className="relative overflow-hidden px-6 pb-20 pt-10 sm:px-10 sm:pb-28 sm:pt-14"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(147,197,253,0.14),_transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <SuperstarLogoFull size={140} className="sm:hidden" />
            <SuperstarLogoFull size={180} className="hidden sm:block" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            getsuperstar.info
          </p>
          <h1 className="mt-5 text-4xl font-bold uppercase leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Your digital stage
            <span className="block">awaits</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600 sm:text-xl">
            Check a handle here on the web. Build and publish your page in the
            Superstar mobile app.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-6">
            <p className="mb-4 text-sm font-medium text-neutral-700">
              Enter your desired handle
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="shrink-0 text-sm font-medium text-neutral-500 sm:text-base">
                getsuperstar.info/
              </span>
              <input
                type="text"
                value={handle}
                onChange={(event) =>
                  setHandle(normalizeHandle(event.target.value))
                }
                placeholder="yourname"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`min-w-0 flex-1 rounded-xl border bg-neutral-50 px-4 py-3 text-base font-medium text-neutral-900 outline-none transition ${inputBorder}`}
                aria-label="Desired handle"
              />
              <button
                type="button"
                onClick={() => {
                  if (normalized) {
                    runCheck(normalized);
                  }
                }}
                disabled={!normalized || checkState === "checking"}
                className={`${actionButtonClass} border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50`}
              >
                {checkState === "checking" ? "Checking…" : "Check"}
              </button>
            </div>

            {message ? (
              <div className="mt-4 space-y-3">
                <p
                  className={`text-sm font-medium ${
                    checkState === "available"
                      ? "text-emerald-600"
                      : checkState === "taken" || checkState === "invalid"
                        ? "text-red-600"
                        : "text-neutral-600"
                  }`}
                >
                  {message}
                </p>
                {checkState === "available" && normalized ? (
                  <Link
                    href={`/app?handle=${encodeURIComponent(normalized)}`}
                    className="inline-flex text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-900"
                  >
                    How to get the app and claim @{normalized} →
                  </Link>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Checking is free on the web. Claiming and building your page
                happens in the app.
              </p>
            )}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-relaxed text-neutral-600 sm:text-lg">
          {tagline}
        </p>
      </div>
    </section>
  );
}

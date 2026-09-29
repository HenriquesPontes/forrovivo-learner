"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  APPLE_WEB_CLIENT_ID,
  APPLE_WEB_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
} from "@/lib/constants";

type SocialSignInProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization?: { id_token?: string };
        }>;
      };
    };
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function SocialSignIn({
  disabled = false,
  onError,
  onBusyChange,
}: SocialSignInProps) {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const finishWithToken = useCallback(
    async (idToken: string) => {
      setBusy(true);
      onBusyChange?.(true);
      try {
        const response = await fetch("/api/auth/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        const data: { message?: string } = await response.json().catch(() => ({}));
        if (!response.ok) {
          onError?.(data.message || "Apple or Google sign-in failed.");
          return;
        }
        router.replace("/home");
        router.refresh();
      } catch {
        onError?.("Apple or Google sign-in failed.");
      } finally {
        setBusy(false);
        onBusyChange?.(false);
      }
    },
    [onBusyChange, onError, router],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          loadScript("https://accounts.google.com/gsi/client", "google-gsi"),
          loadScript(
            "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
            "apple-auth",
          ),
        ]);
        if (cancelled) return;

        window.AppleID?.auth.init({
          clientId: APPLE_WEB_CLIENT_ID,
          scope: "name email",
          redirectURI: APPLE_WEB_REDIRECT_URI,
          usePopup: true,
        });

        if (window.google && googleButtonRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_WEB_CLIENT_ID,
            callback: (response) => {
              if (response.credential) {
                void finishWithToken(response.credential);
              } else {
                onError?.("Google did not return an identity token.");
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 320,
          });
        }

        setScriptsReady(true);
      } catch {
        if (!cancelled) {
          onError?.("Could not load Apple or Google sign-in.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [finishWithToken, onError]);

  async function onAppleClick() {
    if (disabled || busy) return;
    try {
      const result = await window.AppleID?.auth.signIn();
      const idToken = result?.authorization?.id_token;
      if (!idToken) {
        onError?.("Apple did not return an identity token.");
        return;
      }
      await finishWithToken(idToken);
    } catch {
      onError?.("Apple sign-in was cancelled or failed.");
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <button
        type="button"
        onClick={onAppleClick}
        disabled={disabled || busy || !scriptsReady}
        className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-black px-5 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-60"
      >
        <AppleGlyph className="h-5 w-5" />
        Continue with Apple
      </button>

      <div
        ref={googleButtonRef}
        className={`flex min-h-11 w-full justify-center overflow-hidden rounded-lg ${
          disabled || busy ? "pointer-events-none opacity-60" : ""
        }`}
      />

      {!scriptsReady ? (
        <p className="text-center text-xs text-[var(--muted)]">Loading sign-in…</p>
      ) : null}
    </div>
  );
}

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

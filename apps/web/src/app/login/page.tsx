"use client";

import { signInWithGoogle, syncCurrentUserProfile } from "@/lib/auth";
import { useAuth } from "@/components/Providers";
import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const LinkedInLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);


function LoginButtons() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";
  const errorParam = searchParams.get("error");
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isResolvingRef = React.useRef(false);

  const getNextDestination = React.useCallback(
    (onboardingComplete?: boolean, isSubscribed?: boolean) => {
      if (!onboardingComplete) {
        return "/onboarding";
      }

      if (!isSubscribed) {
        return "/subscribe";
      }

      if (callbackUrl === "/onboarding" || callbackUrl === "/checkout" || callbackUrl === "/subscribe") {
        return "/dashboard";
      }

      return callbackUrl;
    },
    [callbackUrl]
  );

  React.useEffect(() => {
    if (!user || isResolvingRef.current) {
      return;
    }

    isResolvingRef.current = true;

    const syncAndRedirect = async () => {
      try {
        const userData = await syncCurrentUserProfile();
        router.replace(getNextDestination(userData.onboarding_complete, userData.isSubscribed));
      } catch (error) {
        console.error("Error resolving signed-in user:", error);
        setAuthError("We could not finish signing you in. Please try again.");
        isResolvingRef.current = false;
      }
    };

    void syncAndRedirect();
  }, [getNextDestination, router, user]);

  React.useEffect(() => {
    if (!errorParam) {
      return;
    }

    const errorMessages: Record<string, string> = {
      invalid_state: "The LinkedIn sign-in session expired. Please try again.",
      linkedin_denied: "LinkedIn sign-in was cancelled.",
      missing_code: "LinkedIn did not return an authorization code.",
      token_exchange: "LinkedIn token exchange failed.",
      no_access_token: "LinkedIn did not return an access token.",
      userinfo: "LinkedIn user information could not be loaded.",
      no_sub: "LinkedIn did not return a valid account identifier.",
      server_error: "A server error occurred during LinkedIn sign-in.",
    };

    setAuthError(errorMessages[errorParam] || "Authentication failed. Please try again.");
  }, [errorParam]);

  const handleSignInWithGoogle = async () => {
    try {
      setIsSubmitting(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setAuthError("Google sign-in failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {authError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {authError}
        </div>
      )}

      <button
        disabled={isSubmitting}
        onClick={() => {
          setIsSubmitting(true);
          setAuthError(null);
          window.location.href = `/api/linkedin/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        }}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0077b5] hover:bg-[#006097] text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LinkedInLogo />
        Continue with LinkedIn
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <SparkleIcon />
          </div>
          <span className="font-bold text-xl tracking-tight">LnkdAgent</span>
        </Link>
      </nav>

      <main className="flex-grow flex items-center justify-center px-6">
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/40 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/50 p-8 md:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
          <div className="text-center space-y-4 mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your account to continue.</p>
          </div>

          <Suspense fallback={<div className="h-32 flex items-center justify-center text-slate-500">Loading...</div>}>
            <LoginButtons />
          </Suspense>

          <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-sm text-slate-500">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-cyan-400 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-cyan-400 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <p className="text-sm text-slate-600">
            © 2026 LnkdAgent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

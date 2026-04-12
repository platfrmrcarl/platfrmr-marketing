"use client";

import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { syncCurrentUserProfile } from "@/lib/auth";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Strict`;
}

function LinkedInCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie("firebase_linkedin_token");

    if (!token) {
      setError("Authentication token not found. Please try signing in again.");
      return;
    }

    // Consume token immediately so it can't be reused
    deleteCookie("firebase_linkedin_token");

    const next = searchParams.get("next") || "/onboarding";

    signInWithCustomToken(auth, token)
      .then(async () => {
        const userData = await syncCurrentUserProfile();
        const destination =
          next === "/onboarding" && userData.onboarding_complete
            ? "/dashboard"
            : next;

        router.replace(destination);
      })
      .catch((err: Error) => {
        console.error("Firebase custom token sign-in failed:", err);
        setError("Sign-in failed. Please try again.");
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <a href="/login" className="text-cyan-400 hover:underline text-sm">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LinkedInCallbackHandler />
    </Suspense>
  );
}

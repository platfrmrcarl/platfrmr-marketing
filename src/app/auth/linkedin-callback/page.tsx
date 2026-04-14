"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LinkedInCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      // 1. Get the custom token from cookies
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      const customToken = getCookie("firebase_linkedin_token");
      const next = searchParams.get("next") || "/dashboard";

      if (!customToken) {
        console.error("No custom token found in cookies");
        setError("Authentication failed. Please try again.");
        setTimeout(() => router.push("/login?error=no_token"), 2000);
        return;
      }

      try {
        // 2. Sign in with the custom token
        await signInWithCustomToken(auth, customToken);

        // 3. Clear the cookie
        document.cookie = "firebase_linkedin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        // 4. Redirect to the target page
        router.push(next);
      } catch (err: any) {
        console.error("Firebase custom token sign-in failed:", err);
        setError("Failed to complete sign-in.");
        setTimeout(() => router.push("/login?error=signin_failed"), 2000);
      }
    };

    void processAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="mt-4 text-gray-600">{error}</p>
          <p className="mt-2 text-sm text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">Completing LinkedIn sign-in...</p>
      </div>
    </div>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <LinkedInCallbackContent />
    </Suspense>
  );
}

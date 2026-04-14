"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Linkedin } from "lucide-react";

function LoginPageContent() {
  const { user, profile, loginWithLinkedIn, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        linkedin_denied: "Access was denied. Please approve the LinkedIn request to sign in.",
        missing_code: "Authentication code is missing. Please try again.",
        invalid_state: "Security check failed. Please try again.",
        token_exchange: "Failed to exchange LinkedIn code for a token.",
        userinfo: "Failed to retrieve your LinkedIn profile information.",
        no_token: "Authentication session expired. Please try again.",
        signin_failed: "Failed to complete the sign-in process."
      };
      setAuthError(errorMessages[error] || "An unexpected error occurred during login.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !loading) {
      if (profile?.subscriptionStatus === "active") {
        router.push("/");
      } else {
        router.push("/products");
      }
    }
  }, [user, profile, loading, router]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithLinkedIn();
    } catch (error: any) {
      console.error("Login failed:", error);
      setAuthError(error.message || "An unexpected error occurred during login.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your LinkedIn marketing agents
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {authError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
              {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0077B5] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005E93] focus:outline-none focus:ring-2 focus:ring-[#0077B5] focus:ring-offset-2"
          >
            <Linkedin className="h-5 w-5" />
            Sign in with LinkedIn
          </button>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

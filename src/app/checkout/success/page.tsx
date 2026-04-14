"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { auth } from "@/lib/firebase";

function CheckoutSuccessContent() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (loading || !profile) return;

    // Check if onboarding is complete and redirect accordingly
    if (profile.subscriptionStatus === "active") {
      if (profile.onboarding_complete) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      return;
    }

    // Fallback: If status isn't active, manually check the subscription status
    const manualCheck = async () => {
      if (checking) return;
      
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      const subscriptionId = getCookie("pending_subscription_id");
      if (!subscriptionId) return;

      setChecking(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch("/api/stripe/check-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ subscriptionId }),
        });

        const data = await response.json();
        if (data.active) {
          // The useAuth onSnapshot listener should pick this up and trigger the other part of the useEffect,
          // but we can also manually check if it was processed.
          // Let's clear the cookie since we've used it.
          document.cookie = "pending_subscription_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
      } catch (err) {
        console.error("Manual subscription check failed:", err);
      } finally {
        setChecking(false);
      }
    };

    // Poll every 3 seconds if not active
    const timer = setInterval(manualCheck, 3000);
    void manualCheck(); // Initial check

    return () => clearInterval(timer);
  }, [profile, loading, router, checking]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Finalizing your subscription</h2>
          <p className="text-gray-600 font-medium max-w-sm">
            We're confirming your payment with Stripe. This should only take a moment.
          </p>
          <p className="text-xs text-gray-400">
            Status: {profile?.subscriptionStatus || "Checking..."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
    </ProtectedRoute>
  );
}

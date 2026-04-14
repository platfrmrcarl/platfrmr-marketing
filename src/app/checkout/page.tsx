"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { app, auth } from "@/lib/firebase";
import { CreditCard, ShieldCheck } from "lucide-react";

// Ensure the environment variable exists to prevent silent rendering failures
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing from environment variables.");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error?.type === "card_error" || error?.type === "validation_error") {
      setMessage(error.message || "An unexpected error occurred.");
    } else if (error) {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Subscribe Now
          </>
        )}
      </button>
      {message && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {message}
        </div>
      )}
    </form>
  );
}

function CheckoutPageContent() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const priceId = searchParams.get("priceId");
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (profile?.subscriptionStatus === "active") {
      router.push("/dashboard");
      return;
    }

    if (!priceId) {
      router.push("/products");
      return;
    }

    const initCheckout = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("Authentication token not found.");

        const response = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ priceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to initialize checkout.");
        }

        if (!data.clientSecret) {
          throw new Error("Unable to initialize checkout.");
        }

        // Store subscription ID in a temporary cookie for fallback check on success page
        if (data.subscriptionId) {
          document.cookie = `pending_subscription_id=${data.subscriptionId}; path=/; max-age=600; SameSite=Lax`;
        }

        setClientSecret(data.clientSecret);
        setInitializationError(null);
      } catch (error: any) {
        console.error("Failed to initialize checkout:", error);
        
        let userMessage = "Unable to initialize checkout right now.";
        if (error.message?.includes("priceId")) {
          userMessage = "No plan was selected. Please go back and choose a plan.";
        } else if (error.message?.includes("unauthenticated")) {
          userMessage = "Your session expired. Please sign in again.";
        } else if (error.details?.message) {
          userMessage = error.details.message;
        } else if (error.message) {
          userMessage = error.message;
        }
        
        setInitializationError(userMessage);
      }
    };

    if (user && !clientSecret && priceId) {
      initCheckout();
    }
  }, [user, profile, loading, router, clientSecret, priceId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (initializationError && !clientSecret) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900">Checkout unavailable</h2>
          <p className="mt-3 text-sm text-gray-600">{initializationError}</p>
          <button
            onClick={() => router.push("/products")}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Complete your subscription</h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure checkout powered by Stripe.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm clientSecret={clientSecret} />
          </Elements>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs">Your payment data is encrypted and secure</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { getAuthToken } from "@/lib/auth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?success=true`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message!);
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full py-4 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-all disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Pay $20 / Month"}
      </button>
      {message && <div id="payment-message" className="text-red-500 text-sm text-center font-medium">{message}</div>}
    </form>
  );
}

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      console.log("Checkout: No user found, redirecting to login");
      router.replace("/login?callbackUrl=/checkout");
      return;
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadSubscription = async () => {
      console.log("Checkout: Initializing subscription...");
      setLoadError(null);
      const idToken = await getAuthToken();

      if (!idToken) {
        console.log("Checkout: No idToken, redirecting to login");
        router.replace("/login?callbackUrl=/checkout");
        return;
      }

      try {
        const response = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          if (data.isAlreadySubscribed) {
            console.log("Checkout: Already subscribed and synced, redirecting...");
            router.replace("/dashboard?success=true");
            return;
          }
          console.log("Checkout: Subscription initialized successfully");
          setClientSecret(data.clientSecret);
        } else {
          console.error("Checkout: Subscription init failed", data.error);
          setLoadError(data.error || "Failed to initialize Stripe checkout.");
        }
      } catch (err) {
        console.error("Checkout: Fetch error", err);
        setLoadError("A network error occurred.");
      }
    };

    void loadSubscription();
  }, [loading, router, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md p-8 bg-white text-slate-900 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-2 text-center text-slate-900">Final Step</h2>
        <p className="text-slate-500 text-center mb-8 font-medium">Complete your subscription to the <span className="text-cyan-600 font-black">Essential</span> plan.</p>
        
        {clientSecret ? (
          <div className="space-y-6">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>
            <button 
              onClick={() => router.push('/subscribe')}
              className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
            >
              &larr; Choose a different plan
            </button>
          </div>
        ) : loadError ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-600 font-bold">{loadError}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing Secure Checkout...</p>
          </div>
        )}
      </div>
    </div>
  );
}

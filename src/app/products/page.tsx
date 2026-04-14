"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export default function ProductsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }

    if (profile?.subscriptionStatus === "active") {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (loading || !user || profile?.subscriptionStatus === "active") {
      return;
    }

    const loadPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError(null);

        const response = await fetch("/api/stripe/products", {
          cache: "no-store",
        });

        const data = (await response.json()) as {
          products?: Plan[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Failed to load products.");
        }

        setPlans(data.products ?? []);
      } catch (error) {
        console.error("Failed to load pricing:", error);
        setPlansError("Unable to load the Essential plan right now.");
      } finally {
        setPlansLoading(false);
      }
    };

    void loadPlans();
  }, [loading, user, profile]);

  const handleSelectPlan = (priceId: string) => {
    router.push(`/checkout?priceId=${encodeURIComponent(priceId)}`);
  };

  if (loading || plansLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-blue-600">Choose Your Subscription</h2>
        </div>
        {plansError ? (
          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {plansError}
          </div>
        ) : plans.length === 0 ? (
          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm">
            No Essential plan is currently available.
          </div>
        ) : (
          <div className="mt-16 flex flex-wrap justify-center gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex w-full max-w-md flex-col rounded-3xl border bg-white p-8 shadow-sm transition-all hover:shadow-xl ${
                  plan.popular ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-100"
                }`}
              >
                {plan.popular && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 px-4 py-1 text-sm font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Zap className="h-6 w-6 text-blue-500" />
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                <p className="mt-4 text-gray-500">{plan.description}</p>

                <p className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                  <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                </p>


                {plan.features.length > 0 && (
                  <div className="mt-8">
                    <div className="mb-2 text-sm font-semibold text-blue-600 uppercase tracking-wide">Marketing Features</div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className="mt-10 block w-full rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}


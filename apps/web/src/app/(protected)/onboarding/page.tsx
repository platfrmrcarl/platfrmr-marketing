"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { getAuthToken } from "@/lib/auth";

interface UserData {
  target_niche?: string;
  target_topics?: string;
  onboarding_complete?: boolean;
  isSubscribed?: boolean;
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    target_niche: "",
    target_topics: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadUserData = async () => {
      const idToken = await getAuthToken();
      if (!idToken) {
        return;
      }

      try {
        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as UserData;
        
        // Pre-fill form if data exists
        if (data.target_niche || data.target_topics) {
          setFormData({
            target_niche: data.target_niche || "",
            target_topics: data.target_topics || "",
          });
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    };

    void loadUserData();
  }, [authLoading, user]);

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error("Unauthorized");
      }

      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to complete onboarding.");
      }

      router.push("/subscribe");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Onboarding error:", err);
      setError(message || "Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-200">
        <h1 className="text-2xl font-bold mb-2 text-center text-slate-800">Complete Your Profile</h1>
        <p className="text-slate-500 text-center mb-8">Set up your strategy, then finalize your subscription on the next step.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="target_niche" className="block text-sm font-medium text-slate-700 mb-1">
              Target Niche
            </label>
            <p className="text-xs text-slate-500 mb-2">Separate niches with commas. (e.g. SaaS Founders, AI Engineering)</p>
            <input
              id="target_niche"
              type="text"
              name="target_niche"
              value={formData.target_niche}
              onChange={handleChange}
              placeholder="SaaS, Fintech, Digital Marketing"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="target_topics" className="block text-sm font-medium text-slate-700 mb-1">
              Target Topics
            </label>
            <p className="text-xs text-slate-500 mb-2">Separate topics with commas. (e.g. LLM patterns, Productivity hacks)</p>
            <textarea
              id="target_topics"
              name="target_topics"
              value={formData.target_topics}
              onChange={handleChange}
              placeholder="Generative AI, Remote Work, Startups"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none h-24"
              required
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save and Continue"}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

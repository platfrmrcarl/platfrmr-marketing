"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./actions";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    target_niche: "",
    target_topics: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await completeOnboarding(formData);
      // Force a session update to reflect onboarding_complete: true in the token
      await update({ onboarding_complete: true });
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-200">
        <h1 className="text-2xl font-bold mb-2 text-center text-slate-800">Complete Your Profile</h1>
        <p className="text-slate-500 text-center mb-8">We need a few details to tailor your LinkedIn strategy.</p>
        
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Finish Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

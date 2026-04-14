"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Target, Lightbulb, ArrowRight, Loader2, Info } from "lucide-react";
import { auth } from "@/lib/firebase";

function OnboardingContent() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [targetNiche, setTargetNiche] = useState("");
  const [targetTopics, setTargetTopics] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile?.onboarding_complete) {
      router.push("/dashboard");
    }
  }, [profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          target_niche: targetNiche,
          target_topics: targetTopics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save onboarding data.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Onboarding submission failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar variant="dashboard" />
      
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 px-8 py-10 text-white text-center">
            <h1 className="text-3xl font-bold">Configure Your Agent</h1>
            <p className="mt-2 text-blue-100">Tell us what to focus on so we can start generating your content.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="niche" className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <Target className="h-4 w-4 text-blue-600" />
                  Your Target Niche
                </label>
                <input
                  id="niche"
                  type="text"
                  required
                  placeholder="e.g. B2B SaaS Founders, Real Estate Agents, AI Engineers"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-gray-900"
                  value={targetNiche}
                  onChange={(e) => setTargetNiche(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 italic">This helps your agent understand the audience and tone.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="topics" className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Core Topics
                </label>
                <textarea
                  id="topics"
                  required
                  rows={4}
                  placeholder="e.g. Productivity hacks, Lead generation, Market trends, Remote work culture"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-gray-900 resize-none"
                  value={targetTopics}
                  onChange={(e) => setTargetTopics(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 italic">List a few key topics or keywords you want to be known for.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !targetNiche || !targetTopics}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Initializing Agent...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}

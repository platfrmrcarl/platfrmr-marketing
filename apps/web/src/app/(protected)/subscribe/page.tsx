"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers";
import { useEffect } from "react";

export default function SubscribePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?callbackUrl=/subscribe");
    }
  }, [loading, user, router]);

  const handleSubscribe = () => {
    router.push("/checkout");
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center mb-12 relative">
        <button 
          onClick={handleBack}
          className="absolute left-0 top-0 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold"
        >
          &larr; Back to Strategy
        </button>
        <h1 className="text-5xl font-black mb-4 tracking-tight">Choose Your Plan</h1>
        <p className="text-slate-400 text-xl">The only thing standing between you and professional LinkedIn growth.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 w-full max-w-lg">
        {/* Only show the Essential plan as requested */}
        <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border-4 border-cyan-500 transform hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 right-0 bg-cyan-500 text-white px-6 py-2 rounded-bl-3xl font-black text-sm tracking-widest uppercase">
            Best Value
          </div>
          
          <h2 className="text-3xl font-black mb-2">Essential</h2>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-5xl font-black">$20</span>
            <span className="text-slate-500 font-bold">/month</span>
          </div>

          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Everything you need to automate your LinkedIn presence and build a professional personal brand.
          </p>

          <ul className="space-y-4 mb-10">
            {[
              "AI Research Agent",
              "AI Content Writer",
              "Daily Automated Posting",
              "Strategic Niche Targeting",
              "Topic-specific Generation"
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 font-bold text-slate-700">
                <div className="w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            className="w-full py-5 bg-slate-900 text-white font-black text-xl rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
          >
            Subscribe Now
          </button>
        </div>
      </div>
      
      <p className="mt-12 text-slate-500 font-medium">
        Secure payment via Stripe. Cancel anytime.
      </p>
    </div>
  );
}

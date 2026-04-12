"use client";

import Link from "next/link";
import React from "react";
import { useAuth } from "@/components/Providers";

type PricingProduct = {
  id: string;
  name: string;
  description: string | null;
  unitAmount: number;
  currency: string;
  interval: string;
  marketingFeatures: string[];
};

// --- Icons (Inline SVGs for no extra dependencies) ---

const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const TargetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export default function Home() {
  const { user } = useAuth();
  const [pricingProduct, setPricingProduct] = React.useState<PricingProduct | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadPricingProduct() {
      try {
        const response = await fetch("/api/stripe/products", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as PricingProduct;
        if (isMounted) {
          setPricingProduct(data);
        }
      } catch {
        // Keep marketing fallback values if Stripe cannot be reached.
      }
    }

    loadPricingProduct();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedPrice =
    pricingProduct && Number.isFinite(pricingProduct.unitAmount)
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: pricingProduct.currency.toUpperCase(),
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(pricingProduct.unitAmount / 100)
      : "$20";

  const billingInterval = pricingProduct?.interval ?? "month";
  const pricingDescription =
    pricingProduct?.description ||
    "Everything you need to grow your LinkedIn profile on autopilot.";
  const ctaLabel = pricingProduct?.name
    ? `Start ${pricingProduct.name}`
    : "Start Professional Plan";
  const pricingFeatures =
    pricingProduct?.marketingFeatures?.length
      ? pricingProduct.marketingFeatures
      : [
          "AI-generated LinkedIn content calendar",
          "Trend-driven post ideas for your market",
          "Voice-matched long-form article writing",
          "Scheduled publishing for consistent reach",
        ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <SparkleIcon />
          </div>
          <span className="font-bold text-xl tracking-tight">LnkdAgent</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <Link
              href="/login"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-sm font-semibold transition-all"
            >
              Sign In
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-sm font-semibold transition-all"
            >
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden text-center">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/40 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]"></div>
          </div>

          <div className="max-w-5xl mx-auto space-y-8 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest">
              <SparkleIcon />
              <span>AI-Powered LinkedIn Domination</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Stand out in your niche, <br />
              <span className="text-cyan-400">while you sleep.</span>
            </h1>

            <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Your personal LinkedIn agent that researches, writes, and publishes 
              tailored articles 24/7. Automation that doesn&apos;t look like automation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="group relative w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started for Free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </span>
              </Link>
              <a 
                href="#features"
                className="w-full sm:w-auto px-10 py-5 border border-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-900 transition-all"
              >
                See how it works
              </a>
            </div>

            {/* Social Proof Placeholder */}
            <div className="pt-16 flex flex-col items-center gap-4 opacity-60">
              <p className="text-sm font-medium text-slate-500">TRUSTED BY CONTENT CREATORS AT</p>
              <div className="flex flex-wrap justify-center gap-8 grayscale brightness-200 contrast-100">
                <span className="text-xl font-bold tracking-tighter">TECHSTAR</span>
                <span className="text-xl font-bold tracking-tighter">NEXUS AI</span>
                <span className="text-xl font-bold tracking-tighter">FLOWCO</span>
                <span className="text-xl font-bold tracking-tighter">SaaSIFY</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-900/40 border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Built for your specific niche.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                General content is boring. We train your agent on your unique expertise and target audience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 hover:border-cyan-500/50 transition-all group">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                  <TargetIcon />
                </div>
                <h3 className="text-xl font-bold mb-3">Niche Research</h3>
                <p className="text-slate-400 leading-relaxed">
                  Our agent scans the web for trending topics and gaps in your specific industry to ensure you&apos;re always leading the conversation.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 hover:border-blue-500/50 transition-all group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                  <SparkleIcon />
                </div>
                <h3 className="text-xl font-bold mb-3">Expert Writing</h3>
                <p className="text-slate-400 leading-relaxed">
                  Using Gemini 1.5 Pro, we generate deep-dive articles that maintain your unique brand voice and authority.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 bg-slate-800/40 rounded-3xl border border-slate-700/50 hover:border-purple-500/50 transition-all group">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  <ClockIcon />
                </div>
                <h3 className="text-xl font-bold mb-3">24/7 Automation</h3>
                <p className="text-slate-400 leading-relaxed">
                  Consistency is key. Our cron-based agents work around the clock to keep your LinkedIn profile active while you focus on business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/50 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
              {/* Pricing Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500/10 blur-[80px] -z-10"></div>
              
              <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing.</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl md:text-7xl font-black">{formattedPrice}</span>
                  <span className="text-slate-400 font-medium">/ {billingInterval}</span>
                </div>
                <p className="text-slate-400 text-lg">{pricingDescription}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto py-8">
                  {pricingFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-slate-300">
                      <div className="text-cyan-400"><CheckIcon /></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/login?callbackUrl=/checkout"
                  className="w-full md:w-auto px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-900/20 transition-all hover:-translate-y-1 inline-block"
                >
                  {ctaLabel}
                </Link>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest pt-4">NO CREDIT CARD REQUIRED TO START</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-slate-500 rounded-lg flex items-center justify-center">
              <SparkleIcon />
            </div>
            <span className="font-bold text-lg tracking-tight">LnkdAgent</span>
          </div>
          
          <div className="flex gap-8 text-sm text-slate-500 font-medium">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>

          <p className="text-sm text-slate-600">
            © 2026 LnkdAgent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Linkedin,
  Radar,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export default function HomePage() {
  const { user, profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: "features" | "pricing"
  ) => {
    event.preventDefault();

    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    const headerOffset = 96;
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.history.replaceState(null, "", `/#${sectionId}`);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar variant="landing" />

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-200">
                <Sparkles className="h-4 w-4" />
                AI LinkedIn marketing agent
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Build your LinkedIn audience with an agent that automates your content.
              </h1>

              <p className="mt-6 max-w-2xl text-lg text-slate-300">
                Turn ideas into posts, hooks, carousels, and publishing plans. Your LinkedIn
                marketing agent helps you stay consistent, grow reach, and build an audience
                without writing every post from scratch.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={user ? "/products" : "/login"}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {user ? "Launch the agent" : "Start growing"}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/#pricing"
                  onClick={(event) => handleSectionClick(event, "pricing")}
                  className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  See pricing
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">10x</div>
                  <div className="mt-1 text-sm text-slate-300">faster content planning</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="mt-1 text-sm text-slate-300">idea generation engine</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">1 agent</div>
                  <div className="mt-1 text-sm text-slate-300">to keep your brand consistent</div>
                </div>
              </div>

              {user && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-sm">
                  Signed in as <span className="font-semibold text-white">{user.email}</span>
                  <div className="mt-1">Plan status: {profile?.subscriptionStatus ?? "none"}</div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/15 p-3">
                  <Bot className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Your audience growth system</h2>
                  <p className="text-sm text-slate-300">Designed for creators, founders, and marketers.</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: CalendarClock,
                    title: "Plan a consistent content calendar",
                    text: "Generate weekly post ideas and never run out of things to say.",
                  },
                  {
                    icon: Linkedin,
                    title: "Write LinkedIn-first content",
                    text: "Create hooks, body copy, and CTAs tailored for audience growth.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Grow reach with smarter iteration",
                    text: "Refine what works and scale the voice that earns attention.",
                  },
                  {
                    icon: Users,
                    title: "Build trust with your audience",
                    text: "Show up consistently with valuable posts powered by your agent.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="rounded-lg bg-white/5 p-2">
                        <Icon className="h-5 w-5 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 border-t border-gray-100 bg-white px-4 py-16 text-slate-900 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-blue-600">Built for your specific niche</h2>
              <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
                Automate your LinkedIn audience and grow in your target niche.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Niche Research",
                  icon: Radar,
                  text: "Our agent scans the web for trending topics and gaps in your specific industry to ensure you're always leading the conversation.",
                },
                {
                  title: "Expert Writing",
                  icon: Sparkles,
                  text: "Using Gemini 1.5 Pro, we generate engaging content that maintains your unique brand voice and authority.",
                },
                {
                  title: "24/7 Consistency",
                  icon: Clock,
                  text: "Consistency is key. Our cron-based agents work around the clock to keep your LinkedIn profile active while you focus on business.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-8 shadow-xs transition-all hover:bg-white hover:shadow-md flex flex-col items-center text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-blue-600">{item.title}</h3>
                      <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                        <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 border-t border-white/10 bg-slate-900/40 px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-base font-semibold uppercase tracking-wide text-blue-400">Simple Pricing</h2>
            </div>

            {plansLoading ? (
              <div className="mt-16 flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : plansError ? (
              <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
                {plansError}
              </div>
            ) : plans.length === 0 ? (
              <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm">
                No Essential plan is currently available.
              </div>
            ) : (
              <div className="mt-16 flex flex-wrap justify-center gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex w-full max-w-sm flex-col rounded-2xl border bg-white/5 p-8 shadow-sm transition-all hover:shadow-xl backdrop-blur ${
                      plan.popular ? "border-blue-500 ring-2 ring-blue-500" : "border-white/10"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 px-4 py-1 text-sm font-bold uppercase tracking-wider text-white">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Zap className="h-6 w-6 text-blue-400" />
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    </div>

                    <p className="mt-4 text-slate-300">{plan.description}</p>

                    <p className="mt-6 flex items-baseline">
                      <span className="text-4xl font-extrabold tracking-tight text-white">{plan.price}</span>
                      <span className="ml-1 text-xl font-semibold text-slate-400">/mo</span>
                    </p>


                    {plan.features.length > 0 && (
                      <div className="mt-8">
                        <div className="mb-2 text-sm font-semibold text-blue-400 uppercase tracking-wide">Marketing Features</div>
                        <ul className="space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <Check className="h-5 w-5 shrink-0 text-green-400" />
                              <span className="text-slate-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Link
                      href="/login"
                      className="mt-10 block w-full rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                    >
                      Choose {plan.name}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}


"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserData } from "../onboarding/actions";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  useEffect(() => {
    if (session?.userId) {
      const fetchUserData = async () => {
        const data = await getUserData();
        if (data) {
          setUserData(data);
        }
      };
      fetchUserData();
    }
  }, [session?.userId]);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const runAgent = async () => {
    if (!userData || !session) return;
    setIsRunning(true);
    setRunResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          target_niche: userData.target_niche,
          target_topics: userData.target_topics,
          linkedin_token: userData.integrations?.linkedin?.access_token,
          user_urn: userData.integrations?.linkedin?.user_urn,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRunResult("Article generated and published successfully!");
      } else {
        setRunResult("Error: " + data.error);
      }
    } catch (error: any) {
      setRunResult("Failed to trigger agent: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const isSubscribed = userData?.isSubscribed || false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
            <span className="text-sm font-bold text-slate-600">{session?.user?.email}</span>
            <div className="h-8 w-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black">
              {session?.user?.name?.charAt(0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                Account Status
            </h3>
            <div className="flex items-center gap-3 mb-6">
                {isSubscribed ? (
                    <span className="px-4 py-1.5 bg-cyan-500/10 text-cyan-600 rounded-full text-xs font-black uppercase tracking-widest border border-cyan-500/20">Active Subscription</span>
                ) : (
                    <span className="px-4 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20">No Active Plan</span>
                )}
            </div>
            <p className="text-slate-500 mb-6 leading-relaxed">
                {isSubscribed 
                    ? "Your LinkedIn agents are running daily to keep your profile active and engaged."
                    : "Upgrade to start your automated LinkedIn growth journey today."}
            </p>
            <Link 
              href={isSubscribed ? "#" : "/checkout"}
              className="text-cyan-600 font-bold hover:text-cyan-500 transition-colors flex items-center gap-1"
            >
              {isSubscribed ? "Manage Billing" : "View Pricing"} &rarr;
            </Link>
          </div>

          <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-4">Agent Strategy</h3>
            <div className="text-slate-500 mb-6 leading-relaxed space-y-2">
                {userData?.target_niche ? (
                    <>
                        <p><span className="font-bold">Niche:</span> {userData.target_niche}</p>
                        <p><span className="font-bold">Topics:</span> {userData.target_topics}</p>
                    </>
                ) : (
                    <p>Define your niche and target topics to train your AI agent.</p>
                )}
            </div>
            <Link 
              href="/onboarding"
              className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all inline-block shadow-lg shadow-slate-900/10"
            >
              {userData?.target_niche ? "Update Strategy" : "Setup Strategy"}
            </Link>

          </div>
        </div>

        <div className="p-10 bg-white rounded-[2.5rem] shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Manual Agent Control</h3>
                    <p className="text-slate-500">Kick off a content run immediately instead of waiting for the cron.</p>
                </div>
                <button
                    onClick={runAgent}
                    disabled={isRunning || !isSubscribed}
                    className="px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-xl shadow-cyan-900/10 flex items-center justify-center gap-3"
                >
                    {isRunning ? (
                        <>
                            <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 3 14 9-14 9V3z"/></svg>
                            Run Agent Now
                        </>
                    )}
                </button>
            </div>

            {runResult && (
                <div className={`p-6 rounded-2xl font-bold mb-8 animate-in fade-in zoom-in duration-300 ${runResult.startsWith("Error") || runResult.startsWith("Failed") ? "bg-red-50 text-red-600 border border-red-100" : "bg-cyan-50 text-cyan-700 border border-cyan-100"}`}>
                    {runResult}
                </div>
            )}

            <h3 className="text-xl font-bold mb-6">Recent Activity History</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800">Article Published</span>
                            <span className="text-sm text-slate-500 italic">"The Future of AI in SaaS Engineering"</span>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-slate-400">Today, 9:30 AM</span>
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800">Agent Run Completed</span>
                            <span className="text-sm text-slate-500">Research & Writing phase successful.</span>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-slate-400">Yesterday, 9:30 AM</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { auth } from "@/lib/firebase";
import { 
  LogOut, 
  Activity, 
  LayoutDashboard, 
  Send, 
  Settings, 
  BarChart3, 
  Target, 
  Plus, 
  Play, 
  History,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

function DashboardContent() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    target_niche: "",
    target_topics: "",
  });
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile && !onboardingForm.target_niche && !onboardingForm.target_topics) {
      setOnboardingForm({
        target_niche: profile.target_niche || "",
        target_topics: profile.target_topics || "",
      });
    }
  }, [profile]);

  const runAgent = async () => {
    setIsRunning(true);
    setRunResult(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error("Unauthorized");
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setRunResult(data.result || "Content generated and published successfully!");
      } else {
        setRunResult("Error: " + (data.error || "Request failed"));
      }
    } catch (error: any) {
      setRunResult("Failed to trigger agent: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const isSubscribed = profile?.subscriptionStatus === "active";

  const saveOnboardingFromModal = async () => {
    setOnboardingSaving(true);
    setOnboardingError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Unauthorized");

      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(onboardingForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save.");

      setShowOnboardingModal(false);
      // useAuth snapshot will update the profile
    } catch (error: any) {
      setOnboardingError(error.message);
    } finally {
      setOnboardingSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar variant="dashboard" />

      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h2 className="text-xl font-bold">Update Strategy</h2>
              <p className="text-blue-100 text-sm mt-1">Refine your AI agent's focus.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Niche</label>
                <input
                  type="text"
                  value={onboardingForm.target_niche}
                  onChange={(e) => setOnboardingForm({...onboardingForm, target_niche: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Topics</label>
                <textarea
                  value={onboardingForm.target_topics}
                  onChange={(e) => setOnboardingForm({...onboardingForm, target_topics: e.target.value})}
                  className="w-full h-24 rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                />
              </div>
              {onboardingError && <p className="text-red-600 text-xs">{onboardingError}</p>}
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowOnboardingModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-600">Cancel</button>
                <button 
                  onClick={saveOnboardingFromModal}
                  disabled={onboardingSaving}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50"
                >
                  {onboardingSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
              <Send className="h-5 w-5" />
              Campaigns
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
              <Settings className="h-5 w-5" />
              Settings
            </a>
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={() => logout()}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
              <p className="text-gray-500">Welcome back to your LinkedIn command center.</p>
            </div>
            
            <button
              onClick={runAgent}
              disabled={isRunning || !isSubscribed}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Run Agent Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="font-bold text-gray-900">{isSubscribed ? 'Active' : 'No Plan'}</span>
              </div>
              {!isSubscribed && <Link href="/products" className="text-blue-600 text-xs font-bold mt-2 inline-block hover:underline">Upgrade Account →</Link>}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Strategy</p>
                <button onClick={() => setShowOnboardingModal(true)} className="text-blue-600 text-xs font-bold hover:underline">Edit</button>
              </div>
              <p className="text-sm font-medium text-gray-700 truncate">
                <span className="text-gray-400">Niche:</span> {profile?.target_niche || "Not set"} • <span className="text-gray-400">Topics:</span> {profile?.target_topics || "Not set"}
              </p>
            </div>
          </div>

          {runResult && (
            <div className={`p-6 rounded-2xl mb-8 border ${runResult.startsWith("Error") ? "bg-red-50 border-red-100 text-red-700" : "bg-blue-50 border-blue-100 text-blue-700"}`}>
              <p className="text-sm font-mono whitespace-pre-wrap">{runResult}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[1, 2].map((i) => (
                <div key={i} className="px-8 py-6 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">LinkedIn post generated</p>
                    <p className="text-xs text-gray-500 italic truncate">&quot;The power of AI-driven LinkedIn automation...&quot;</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tight shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Success
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

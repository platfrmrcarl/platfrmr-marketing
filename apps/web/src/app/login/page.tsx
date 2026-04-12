"use client";

import { signIn } from "next-auth/react";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const LinkedInLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

function LoginButtons() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";

  return (
    <div className="space-y-4">
      <button
        onClick={() => signIn("linkedin", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0077b5] hover:bg-[#006097] text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <LinkedInLogo />
        Continue with LinkedIn
      </button>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-950 font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <GoogleLogo />
        Continue with Google
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <SparkleIcon />
          </div>
          <span className="font-bold text-xl tracking-tight">LnkdAgent</span>
        </Link>
      </nav>

      <main className="flex-grow flex items-center justify-center px-6">
        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/40 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/50 p-8 md:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
          <div className="text-center space-y-4 mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your account to continue.</p>
          </div>

          <Suspense fallback={<div className="h-32 flex items-center justify-center text-slate-500">Loading...</div>}>
            <LoginButtons />
          </Suspense>

          <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-sm text-slate-500">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-cyan-400 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-cyan-400 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <p className="text-sm text-slate-600">
            © 2026 LnkdAgent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

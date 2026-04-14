"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { Activity, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  variant?: "landing" | "dashboard";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  const { user, profile, logout, loginWithLinkedIn } = useAuth();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (variant !== "landing") return;

    const updateActiveSection = () => {
      const featuresSection = document.getElementById("features");
      const pricingSection = document.getElementById("pricing");
      const offset = 120;
      const scrollPosition = window.scrollY + offset;

      if (pricingSection && scrollPosition >= pricingSection.offsetTop) {
        setActiveSection("pricing");
        return;
      }

      if (featuresSection && scrollPosition >= featuresSection.offsetTop) {
        setActiveSection("features");
        return;
      }

      setActiveSection(null);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [variant]);

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    if (pathname !== "/") return; // Only smooth scroll on home page
    
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) return;

    const headerOffset = 96;
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: "smooth" });
  };

  const navLinkClass = (sectionId: string) =>
    `rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
      activeSection === sectionId
        ? "border-blue-400 bg-blue-500/20 text-white"
        : "border-white/10 text-slate-200 hover:bg-white/5 hover:text-white"
    }`;

  const isLanding = variant === "landing";

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur ${
      isLanding 
        ? "border-white/10 bg-slate-950/80 text-white" 
        : "border-gray-200 bg-white/80 text-gray-900"
    }`}>
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <Activity className={`h-6 w-6 ${isLanding ? "text-blue-400" : "text-blue-600"}`} />
          <span className="text-xl font-bold">LinkedInAgent</span>
        </Link>

        <nav className="hidden sm:flex items-center justify-center gap-3">
          {isLanding && pathname === "/" ? (
            <>
              <Link 
                href="/#features" 
                onClick={(e) => handleSectionClick(e, "features")} 
                className={navLinkClass("features")}
              >
                Features
              </Link>
              <Link 
                href="/#pricing" 
                onClick={(e) => handleSectionClick(e, "pricing")} 
                className={navLinkClass("pricing")}
              >
                Pricing
              </Link>
            </>
          ) : !isLanding && pathname !== "/products" ? (
            <div className="flex items-center gap-6">
               <Link href="/dashboard" className={`text-sm font-medium ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                Overview
              </Link>
              <Link href="/products" className={`text-sm font-medium ${pathname === '/products' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                Plans
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="flex items-center gap-3 justify-self-end">
          {user ? (
            <>
              {!pathname.startsWith('/dashboard') && (
                <Link
                  href={profile?.subscriptionStatus === "active" ? "/dashboard" : "/products"}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isLanding 
                      ? "bg-blue-600 text-white hover:bg-blue-500" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {profile?.subscriptionStatus === "active" ? "Open dashboard" : "Upgrade now"}
                </Link>
              )}
              
              {variant === "dashboard" ? (
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs font-semibold text-gray-900">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">
                      {profile?.subscriptionStatus || 'free'}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logout()}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    isLanding 
                      ? "border-white/10 text-slate-200 hover:bg-white/5" 
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isLanding 
                  ? "bg-blue-600 text-white hover:bg-blue-500" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

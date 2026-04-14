"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (profile?.subscriptionStatus !== "active" && pathname !== "/products" && !pathname.startsWith("/checkout")) {
      router.push("/products");
      return;
    }

    if (profile?.subscriptionStatus === "active") {
      if (!profile.onboarding_complete && pathname !== "/onboarding") {
        router.push("/onboarding");
        return;
      }
      
      if (profile.onboarding_complete && (pathname === "/products" || pathname.startsWith("/checkout") || pathname === "/onboarding")) {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading || !user || (user && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
};

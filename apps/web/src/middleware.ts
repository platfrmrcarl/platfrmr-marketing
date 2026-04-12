import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isOnboardingPage = req.nextUrl.pathname.startsWith("/onboarding");

    if (isAuth) {
      const onboardingComplete = token.onboarding_complete;

      if (!onboardingComplete && !isOnboardingPage) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (onboardingComplete && isOnboardingPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/api/generate/:path*"],
};

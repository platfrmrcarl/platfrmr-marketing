import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authAdmin, dbAdmin } from "@/lib/firebase-admin";

interface LinkedInUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const loginUrl = `${url.origin}/login`;

  if (errorParam) {
    return NextResponse.redirect(`${loginUrl}?error=linkedin_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${loginUrl}?error=missing_code`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("linkedin_oauth_state")?.value;
  const callbackUrl = cookieStore.get("linkedin_callback_url")?.value || "/dashboard";

  // Validate CSRF state
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${loginUrl}?error=invalid_state`);
  }

  // Clear one-time cookies immediately
  cookieStore.delete("linkedin_oauth_state");
  cookieStore.delete("linkedin_callback_url");

  try {
    // Step 1: Exchange authorization code for tokens
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${url.origin}/api/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      console.error("LinkedIn token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${loginUrl}?error=token_exchange`);
    }

    const tokenData = (await tokenRes.json()) as { 
      access_token: string; 
      expires_in: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
    };
    
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // Usually 5184000 seconds (60 days)
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    if (!accessToken) {
      return NextResponse.redirect(`${loginUrl}?error=no_access_token`);
    }

    // Step 2: Fetch user profile via LinkedIn OIDC userinfo endpoint
    const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      console.error("LinkedIn userinfo failed:", await userInfoRes.text());
      return NextResponse.redirect(`${loginUrl}?error=userinfo`);
    }

    const userInfo = (await userInfoRes.json()) as LinkedInUserInfo;
    const { sub, email, name, picture } = userInfo;

    if (!sub) {
      return NextResponse.redirect(`${loginUrl}?error=no_sub`);
    }

    // Step 3: Create or update user document in Firestore
    const userRef = dbAdmin.collection("users").doc(sub);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const isNewUser = !userSnap.exists;
    
    const onboardingComplete = isNewUser
      ? false
      : (userData?.onboarding_complete ?? false);

    await userRef.set(
      {
        email: email ?? null,
        name: name ?? null,
        picture: picture ?? null,
        linkedin_id: sub,
        onboarding_complete: onboardingComplete,
        integrations: {
          linkedin: { 
            access_token: accessToken,
            expires_at: expiresAt,
            // Store refresh token info if provided
            ...(tokenData.refresh_token ? { 
              refresh_token: tokenData.refresh_token,
              refresh_token_expires_at: new Date(Date.now() + (tokenData.refresh_token_expires_in || 0) * 1000).toISOString()
            } : {})
          },
        },
        updatedAt: new Date().toISOString(),
        ...(isNewUser ? { createdAt: new Date().toISOString() } : {}),
      },
      { merge: true }
    );

    const isSubscribedStatus = !isNewUser && userData?.subscriptionStatus === "active";

    // Step 4: Mint a Firebase custom token for this LinkedIn user
    const customToken = await authAdmin.createCustomToken(sub, {
      provider: "linkedin",
      email: email ?? null,
    });

    // Step 5: Set short-lived cookie for the client handler to consume
    let resolvedCallbackUrl = callbackUrl;

    if (!isSubscribedStatus) {
      resolvedCallbackUrl = "/products";
    } else {
      resolvedCallbackUrl = "/dashboard";
    }

    const encodedCallbackUrl = encodeURIComponent(resolvedCallbackUrl);
    const response = NextResponse.redirect(
      `${url.origin}/auth/linkedin-callback?next=${encodedCallbackUrl}`
    );

    response.cookies.set("firebase_linkedin_token", customToken, {
      httpOnly: false, // Must be readable by client-side JS for signInWithCustomToken
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60, // 60-second single-use window
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error);
    return NextResponse.redirect(`${loginUrl}?error=server_error`);
  }
}

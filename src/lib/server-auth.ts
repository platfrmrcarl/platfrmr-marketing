import { authAdmin } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "__session";

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function verifyFirebaseRequest(request: Request) {
  const authorization = request.headers.get("authorization");

  try {
    if (authorization?.startsWith("Bearer ")) {
      const idToken = authorization.slice("Bearer ".length);
      return await authAdmin.verifyIdToken(idToken);
    }

    const sessionCookie = getCookieValue(request, SESSION_COOKIE_NAME);
    if (!sessionCookie) {
      return null;
    }

    return await authAdmin.verifySessionCookie(sessionCookie, false);
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return null;
  }
}
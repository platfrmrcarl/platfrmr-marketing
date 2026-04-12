import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authAdmin } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "__session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect("/");
  }

  try {
    await authAdmin.verifySessionCookie(sessionCookie, false);
  } catch {
    redirect("/");
  }

  return <>{children}</>;
}

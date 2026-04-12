"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { dbAdmin } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: { target_topics: string; target_niche: string }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const userRef = dbAdmin.collection("users").doc(session.userId);

  // Sanitize input
  const topics = formData.target_topics
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(", ");
    
  const niche = formData.target_niche
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .join(", ");

  await userRef.update({
    target_topics: topics,
    target_niche: niche,
    onboarding_complete: true,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}

export async function getUserData() {
  const session = await getServerSession(authOptions);
  if (!session || !session.userId) return null;

  const userRef = dbAdmin.collection("users").doc(session.userId);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    return userSnap.data();
  }
  return null;
}

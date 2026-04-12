import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { verifyFirebaseRequest } from "@/lib/server-auth";

function sanitizeCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

export async function GET(request: Request) {
  const decodedToken = await verifyFirebaseRequest(request);

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRef = dbAdmin.collection("users").doc(decodedToken.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set(
      {
        email: decodedToken.email ?? null,
        name: decodedToken.name ?? null,
        picture: decodedToken.picture ?? null,
        onboarding_complete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } else {
    await userRef.set(
      {
        email: decodedToken.email ?? userSnap.data()?.email ?? null,
        name: decodedToken.name ?? userSnap.data()?.name ?? null,
        picture: decodedToken.picture ?? userSnap.data()?.picture ?? null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  const latestSnapshot = await userRef.get();
  return NextResponse.json({ id: decodedToken.uid, ...latestSnapshot.data() });
}

export async function PATCH(request: Request) {
  const decodedToken = await verifyFirebaseRequest(request);

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    target_topics?: string;
    target_niche?: string;
    subscription_plan?: string;
  };

  const targetTopics = sanitizeCsv(body.target_topics ?? "");
  const targetNiche = sanitizeCsv(body.target_niche ?? "");
  const subscriptionPlan = body.subscription_plan === "pro_monthly" ? "pro_monthly" : "";

  if (!targetTopics || !targetNiche || !subscriptionPlan) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userRef = dbAdmin.collection("users").doc(decodedToken.uid);
  await userRef.set(
    {
      target_topics: targetTopics,
      target_niche: targetNiche,
      subscription_plan: subscriptionPlan,
      onboarding_complete: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const userSnap = await userRef.get();
  return NextResponse.json({ id: decodedToken.uid, ...userSnap.data() });
}
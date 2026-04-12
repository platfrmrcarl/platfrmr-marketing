import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";

export type User = FirebaseUser & {
  requiresOnboarding?: boolean;
};

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await fetch("/api/session", {
      method: "DELETE",
    });
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export async function getAuthToken() {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export async function establishServerSession() {
  const idToken = await getAuthToken();

  if (!idToken) {
    throw new Error("Missing Firebase ID token");
  }

  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to establish server session");
  }
}

export async function syncCurrentUserProfile() {
  await establishServerSession();

  const idToken = await getAuthToken();

  if (!idToken) {
    throw new Error("Missing Firebase ID token");
  }

  const response = await fetch("/api/user", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to sync user profile");
  }

  return response.json() as Promise<{ onboarding_complete?: boolean; isSubscribed?: boolean }>;
}

export { onAuthStateChanged };

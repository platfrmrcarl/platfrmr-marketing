"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  User,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
  email: string | null;
  subscriptionStatus: 'none' | 'active';
  stripeCustomerId?: string;
  onboarding_complete?: boolean;
  target_niche?: string;
  target_topics?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithLinkedIn: (callbackPath?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }
      
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const fallbackProfile: UserProfile = {
          email: user.email,
          subscriptionStatus: 'none',
        };

        try {
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            await setDoc(userDocRef, fallbackProfile);
            setProfile(fallbackProfile);
          } else {
            setProfile(userDoc.data() as UserProfile);
          }

          // Listen for profile changes
          unsubProfile = onSnapshot(
            userDocRef,
            (doc) => {
              if (doc.exists()) {
                setProfile(doc.data() as UserProfile);
              }
            },
            (error) => {
              console.warn("Profile sync unavailable; using basic auth state.", error);
              setProfile((currentProfile) => currentProfile ?? fallbackProfile);
            }
          );
        } catch (error) {
          console.warn("Profile access unavailable; using basic auth state.", error);
          setProfile(fallbackProfile);
        }

        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const loginWithLinkedIn = async (callbackPath?: string) => {
    // Redirect to our custom LinkedIn auth API
    const target = callbackPath ? encodeURIComponent(callbackPath) : "dashboard";
    window.location.href = `/api/linkedin/auth?callbackUrl=${target}`;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithLinkedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

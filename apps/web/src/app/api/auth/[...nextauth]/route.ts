import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { dbAdmin } from "@/lib/firebase-admin";

declare module "next-auth" {
  interface Session {
    userId: string;
    accessToken?: string;
    provider?: string;
    onboarding_complete?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: "openid profile email w_member_social" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.userId = account.providerAccountId;
      }

      if (trigger === "update" && session?.onboarding_complete !== undefined) {
        token.onboarding_complete = session.onboarding_complete;
      }
      
      // If we don't have onboarding_complete in the token, fetch it from Firestore
      if (token.sub && token.onboarding_complete === undefined) {
        const userRef = dbAdmin.collection("users").doc(token.sub);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          token.onboarding_complete = userSnap.data()?.onboarding_complete || false;
        } else {
          // If the user doesn't exist yet, it's their first time signing in
          token.onboarding_complete = false;
          // We can't wait for session callback to create the user if we want onboarding_complete in JWT
          await userRef.set({
            email: token.email,
            name: token.name,
            onboarding_complete: false,
            createdAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      session.userId = token.sub as string;
      session.onboarding_complete = token.onboarding_complete as boolean;

      if (token.sub) {
        const userRef = dbAdmin.collection("users").doc(token.sub);
        
        // Save the LinkedIn token to Firestore if available
        if (token.provider === "linkedin" && token.accessToken) {
            await userRef.set({
                linkedin_id: token.userId, // Storing linkedin_id as per spec
                integrations: {
                    linkedin: {
                        access_token: token.accessToken,
                    }
                }
            }, { merge: true });
        }
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

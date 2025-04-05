import type { NextAuthOptions } from "next-auth"
import AppleProvider from "next-auth/providers/apple"

export const authOptions: NextAuthOptions = {
  providers: [
    AppleProvider({
      clientId: process.env.APPLE_ID || "",
      clientSecret: process.env.APPLE_SECRET || "",
    }),
    // You can keep other providers here if needed
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}


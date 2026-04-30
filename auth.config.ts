import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth = nextUrl.pathname.startsWith("/login") || 
                       nextUrl.pathname.startsWith("/register") ||
                       nextUrl.pathname.startsWith("/forgot-password");
      const isOnApp = nextUrl.pathname.startsWith("/dashboard") ||
                      nextUrl.pathname.startsWith("/(app)");
      
      if (isOnApp) {
        return isLoggedIn;
      } else if (isOnAuth) {
        return !isLoggedIn || true; // Allow both logged in and out users to access auth pages
      }
      
      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;

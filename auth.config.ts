import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/forgot-password");
      const isOnOnboarding = nextUrl.pathname.startsWith("/onboarding");
      const isOnApp =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/(app)");

      // Protect app routes (require login)
      if (isOnApp) {
        return isLoggedIn;
      }

      // Allow both logged in and out users to access auth pages
      if (isOnAuth) {
        return !isLoggedIn || true;
      }

      // Protect onboarding routes (require login)
      if (isOnOnboarding) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;

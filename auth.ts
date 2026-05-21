import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? "";
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(
          credentials.password ?? credentials.senha ?? credentials.palavraPasse ?? "",
        );

        if (!email || !password) return null;

        const user = await prisma.utilizador.findUnique({
          where: { email },
        });

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.nome,
          };
        }

        return null;
      },
    }),
  ],
});

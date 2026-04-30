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
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials;

        if (!email || !password) return null;

        const user = await prisma.utilizador.findUnique({
          where: { email: email as string },
        });

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(
          password as string,
          user.passwordHash
        );

        if (passwordsMatch) return user;

        return null;
      },
    }),
  ],
});

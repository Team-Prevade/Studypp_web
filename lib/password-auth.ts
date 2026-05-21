import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export type PasswordAuthUser = {
  id: string;
  nome: string;
  email: string;
  onboardingFeito: boolean;
};

type PasswordInput = Record<string, unknown> | null | undefined;

export function normalizeAuthEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

export function readPasswordCredential(input: PasswordInput) {
  return String(input?.password ?? input?.senha ?? input?.palavraPasse ?? "");
}

export async function authenticateWithPassword(emailInput: unknown, passwordInput: unknown) {
  const email = normalizeAuthEmail(emailInput);
  const password = String(passwordInput ?? "");

  if (!email || !password) return null;

  const user = await prisma.utilizador.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      passwordHash: true,
      onboardingFeito: true,
    },
  });

  if (!user) return null;

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) return null;

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser satisfies PasswordAuthUser;
}

export async function authenticatePayloadWithPassword(input: PasswordInput) {
  return authenticateWithPassword(input?.email, readPasswordCredential(input));
}

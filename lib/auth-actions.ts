"use server";

import { clearSession, createSession } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticateWithPassword, normalizeAuthEmail } from "@/lib/password-auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function loginAction(email: string, password: string) {
  try {
    const user = await authenticateWithPassword(email, password);

    if (!user) {
      return {
        success: false,
        error: "Email ou palavra-passe incorretos",
      };
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.nome,
    });

    if (!user.onboardingFeito) {
      redirect("/onboarding/perfil");
    }

    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Login error:", error);
    return {
      success: false,
      error: "Erro ao fazer login. Tente novamente.",
    };
  }
}

export async function registerAction(
  nome: string,
  email: string,
  password: string,
  confirmPassword: string,
) {
  try {
    const normalizedEmail = normalizeAuthEmail(email);

    if (!nome || !normalizedEmail || !password || !confirmPassword) {
      return {
        success: false,
        error: "Todos os campos sao obrigatorios",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "As palavras-passe nao coincidem",
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "A palavra-passe deve ter pelo menos 8 caracteres",
      };
    }

    const existingUser = await prisma.utilizador.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Este email ja esta registado",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.utilizador.create({
      data: {
        nome,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.nome,
    });

    redirect("/onboarding/perfil");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Register error:", error);
    return {
      success: false,
      error: "Erro ao registar. Tente novamente.",
    };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

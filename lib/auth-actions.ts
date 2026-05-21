"use server";

import { signIn as authSignIn, signOut as authSignOut } from "@/auth";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeAuthEmail } from "@/lib/password-auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function loginAction(email: string, password: string) {
  try {
    const normalizedEmail = normalizeAuthEmail(email);
    const result = await authSignIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    if (!result || !result.ok) {
      return {
        success: false,
        error: "Email ou palavra-passe incorretos",
      };
    }

    // Check if onboarding is done
    const user = await prisma.utilizador.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user?.onboardingFeito) {
      redirect("/onboarding/perfil");
    } else {
      redirect("/dashboard");
    }
  } catch (error) {
    // Relançar redirect errors
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return {
        success: false,
        error: "Email ou palavra-passe incorretos",
      };
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
    // Validações
    if (!nome || !email || !password || !confirmPassword) {
      return {
        success: false,
        error: "Todos os campos são obrigatórios",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "As palavras-passe não coincidem",
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "A palavra-passe deve ter pelo menos 8 caracteres",
      };
    }

    // Verificar se email já existe
    const existingUser = await prisma.utilizador.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Este email já está registado",
      };
    }

    // Hash da password
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar utilizador
    await prisma.utilizador.create({
      data: {
        nome,
        email: normalizedEmail,
        passwordHash,
      },
    });

    // Fazer login automático
    await authSignIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
    });

    // Redirect to onboarding
    redirect("/onboarding/perfil");
  } catch (error) {
    // Relançar redirect errors
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
  await authSignOut({ redirectTo: "/login" });
}

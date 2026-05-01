"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getProfileAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado", data: null };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
      include: {
        _count: {
          select: {
            aulas: true,
            tarefas: true,
            notas: true,
            disciplinas: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado", data: null };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      success: false,
      error: "Erro ao carregar perfil",
      data: null,
    };
  }
}

export async function updateProfileAction(nome: string, email: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    // Update user
    await prisma.utilizador.update({
      where: { email: session.user.email },
      data: {
        nome,
        email: email || session.user.email,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Erro ao atualizar perfil" };
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado" };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "As senhas não coincidem" };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: "A senha deve ter pelo menos 6 caracteres",
      };
    }

    // In a real app, you would verify the current password
    // For now, this is a placeholder
    // You would need bcryptjs to hash and verify

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Erro ao alterar senha" };
  }
}

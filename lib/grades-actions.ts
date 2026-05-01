"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getGradesAction() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "Não autenticado", data: null };
    }

    const user = await prisma.utilizador.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, error: "Utilizador não encontrado", data: null };
    }

    // Fetch all assessments
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        utilizadorId: user.id,
      },
      include: {
        disciplina: true,
      },
      orderBy: { data: "desc" },
    });

    // Calculate global average
    const mediaGlobal =
      avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0;

    // Group by discipline and calculate averages
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        utilizadorId: user.id,
      },
      orderBy: { ordem: "asc" },
    });

    const mediasPorDisciplina = disciplinas.map((d) => {
      const notasDisciplina = avaliacoes.filter((a) => a.disciplinaId === d.id);
      const media =
        notasDisciplina.length > 0
          ? notasDisciplina.reduce((sum, a) => sum + a.nota, 0) /
            notasDisciplina.length
          : 0;
      return {
        id: d.id,
        nome: d.nome,
        cor: d.cor,
        media: Math.round(media * 10) / 10,
        totalNotas: notasDisciplina.length,
        avaliacoes: notasDisciplina,
      };
    });

    // Count by scale
    const escalaAvaliacao = {
      excelente: avaliacoes.filter((a) => a.nota >= 14).length,
      suficiente: avaliacoes.filter((a) => a.nota >= 10 && a.nota < 14).length,
      insuficiente: avaliacoes.filter((a) => a.nota < 10).length,
    };

    return {
      success: true,
      data: {
        avaliacoes,
        mediaGlobal: Math.round(mediaGlobal * 10) / 10,
        totalAvaliacoes: avaliacoes.length,
        mediasPorDisciplina,
        escalaAvaliacao,
      },
    };
  } catch (error) {
    console.error("Error fetching grades:", error);
    return {
      success: false,
      error: "Erro ao carregar notas",
      data: null,
    };
  }
}

export const CALENDAR_EVENT_STYLE: Record<
  string,
  { label: string; color: string; softColor: string }
> = {
  TESTE_EXAME: {
    label: "Teste ou exame",
    color: "#F97316",
    softColor: "#FFF7ED",
  },
  ENTREGA_TRABALHO: {
    label: "Entrega de trabalho",
    color: "#14B8A6",
    softColor: "#F0FDFA",
  },
  EVENTO_PESSOAL: {
    label: "Pessoal",
    color: "#8B5CF6",
    softColor: "#F5F3FF",
  },
  FERIADO: {
    label: "Feriado",
    color: "#2563EB",
    softColor: "#EFF6FF",
  },
};

export function getCalendarEventStyle(tipo?: string | null) {
  return CALENDAR_EVENT_STYLE[tipo || ""] ?? CALENDAR_EVENT_STYLE.EVENTO_PESSOAL;
}

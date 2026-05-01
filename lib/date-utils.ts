// Mapeamento de dia da semana (0-6 do JavaScript para DiaSemana do Prisma)
export function mapDiaSemana(dayOfWeek: number): string {
  const dias = [
    "DOMINGO",
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
  ];
  return dias[dayOfWeek];
}

// Obter nome do dia em português
export function getNomeDia(date: Date): string {
  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  return dias[date.getDay()];
}

// Formatar data em português (ex: "Segunda-feira, 23 de Maio")
export function formatarDataPT(date: Date): string {
  const dia = getNomeDia(date);
  const numero = date.getDate();
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const mes = meses[date.getMonth()];
  return `${dia}, ${numero} de ${mes}`;
}

// Formatar horário (ex: "08:00" → "8:00")
export function formatarHora(hora: string): string {
  const [h, m] = hora.split(":");
  return `${parseInt(h)}:${m}`;
}

// Calcular duração entre duas horas (ex: "08:00" e "09:30" → "1h 30m")
export function calcularDuracao(horaInicio: string, horaFim: string): string {
  const [hI, mI] = horaInicio.split(":").map(Number);
  const [hF, mF] = horaFim.split(":").map(Number);

  let duracao = hF * 60 + mF - (hI * 60 + mI);
  if (duracao < 0) duracao += 24 * 60; // Próximo dia

  const horas = Math.floor(duracao / 60);
  const minutos = duracao % 60;

  if (horas === 0) return `${minutos}m`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}m`;
}

// Obter início da semana (segunda-feira)
export function getInicioDaSemana(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
  return new Date(d.setDate(diff));
}

// Obter fim da semana (domingo)
export function getFimDaSemana(date: Date = new Date()): Date {
  const inicio = getInicioDaSemana(date);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

// Pluralizar (ex: "1 tarefa", "2 tarefas")
export function pluralizar(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + "s"}`;
}

// Calcular dias até uma data
export function diasAte(date: Date): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(date);
  alvo.setHours(0, 0, 0, 0);
  const diff = alvo.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Formatar tempo relativo (ex: "Hoje", "Amanhã", "Em 3 dias", "Atrasado")
export function formatarTempoRelativo(date: Date): string {
  const dias = diasAte(date);
  if (dias < 0) return "Atrasado";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

// Converter minutos em horas e minutos (ex: 90 → "1h 30m")
export function formatarMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Converter segundos em formato HH:MM:SS
export function formatarSegundos(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;

  const partes = [];
  if (h > 0) partes.push(`${h}h`);
  if (m > 0) partes.push(`${m}m`);
  if (s > 0) partes.push(`${s}s`);

  return partes.join(" ") || "0s";
}

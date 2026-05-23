import Image from "next/image";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Command,
  FileText,
  MessageSquareText,
  NotebookTabs,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { LandingCursor } from "@/components/landing/landing-cursor";
import { BorderBeam } from "@/components/magicui/border-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Marquee } from "@/components/magicui/marquee";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const navItems = [
  ["Produto", "#produto"],
  ["IA", "#ia"],
  ["Fluxo", "#fluxo"],
  ["Mobile", "#mobile"],
];

const marqueeItems = [
  "Apontamentos",
  "Tarefas",
  "Calendario",
  "Disciplinas",
  "Objetivos",
  "Temporizador",
  "Lembretes",
  "Notas",
  "Assistente IA",
];

const modules = [
  {
    icon: NotebookTabs,
    title: "Editor de apontamentos",
    text: "Notas ricas, anexos, PDF, imagens, referencias por @ e sugestoes discretas enquanto escreves.",
  },
  {
    icon: MessageSquareText,
    title: "Assistente que executa",
    text: "Cria tarefas, eventos, lembretes e disciplinas por linguagem natural, sempre com confirmacao.",
  },
  {
    icon: CalendarDays,
    title: "Agenda academica",
    text: "Horario, calendario, testes, entregas e prazos ligados as disciplinas certas.",
  },
  {
    icon: TimerReset,
    title: "Ambiente de foco",
    text: "Sessoes de estudo com contexto, regras claras e historico de tempo por semana.",
  },
];

const timeline = [
  {
    title: "Captura",
    text: "Guarda a aula, o PDF, as ideias soltas e as tarefas que nasceram daquele momento.",
  },
  {
    title: "Organiza",
    text: "Liga apontamentos a disciplinas, tarefas, aulas e prazos sem perder contexto.",
  },
  {
    title: "Age",
    text: "Pede ao assistente para transformar o plano em acoes reais e confirma o que queres criar.",
  },
];

export default function Home() {
  return (
    <main className={`${spaceGrotesk.className} min-h-screen overflow-hidden bg-[#fbfcff] text-slate-950`}>
      <LandingCursor />
      <header className="reveal-down fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Study++">
            <span className="relative h-10 w-9">
              <Image src="/brand/logo-mark.svg" alt="Study++" fill priority sizes="36px" className="object-contain" />
            </span>
            <span className="text-base font-black tracking-normal text-slate-950">Study++</span>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 text-sm font-semibold text-slate-600 shadow-sm md:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="rounded-full px-4 py-2 transition hover:bg-slate-950 hover:text-white">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">
              Entrar
            </Link>
            <Link href="/register" className="brand-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-white">
              Comecar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate px-5 pt-28 sm:px-8">
        <DotPattern className="opacity-80" />
        <div className="absolute left-1/2 top-20 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,44,255,.18),rgba(24,167,255,.12),transparent_65%)] blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="reveal-up inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-sm font-bold text-blue-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Plataforma de estudo com IA acionavel
            </div>

            <h1 className="reveal-up reveal-delay-100 mt-7 text-balance text-5xl font-black leading-[0.98] tracking-normal text-slate-950 sm:text-7xl lg:text-8xl">
              O cockpit do teu <AnimatedGradientText>estudo diario.</AnimatedGradientText>
            </h1>

            <p className="reveal-up reveal-delay-200 mx-auto mt-7 max-w-2xl text-pretty text-base leading-8 text-slate-600 sm:text-lg">
              Study++ une apontamentos, agenda, tarefas, foco, objetivos e um assistente que entende o teu contexto e prepara acoes para confirmares.
            </p>

            <div className="reveal-up reveal-delay-300 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="brand-button inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-black text-white">
                Criar espaco de estudo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
                <Command className="h-4 w-4" />
                Abrir app
              </Link>
            </div>
          </div>

          <div className="reveal-up reveal-delay-400">
            <ProductShowcase />
          </div>

          <Marquee className="reveal-up reveal-delay-500 mx-auto mt-10 max-w-5xl">
            {marqueeItems.map((item) => (
              <span key={item} className="shrink-0 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
                {item}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      <section id="produto" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="reveal-view grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-blue-700">Sistema, nao checklist</p>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Cada modulo conversa com o outro.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            O que nasce numa aula pode virar apontamento, tarefa, lembrete, evento, sessao de foco ou conversa com historico. A sensacao e de um produto unico, nao de abas soltas.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module, index) => (
            <FeatureCard key={module.title} icon={<module.icon className="h-5 w-5" />} title={module.title} index={index}>
              {module.text}
            </FeatureCard>
          ))}
        </div>
      </section>

      <section id="ia" className="relative border-y border-slate-200 bg-slate-950 px-5 py-24 text-white sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,44,255,.24),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(24,167,255,.18),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="reveal-view">
            <p className="text-sm font-black uppercase tracking-normal text-sky-300">Assistente IA</p>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Ele nao conversa por conversar.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              O assistente le o teu contexto academico, guarda o historico e devolve cards de acao. Nada e gravado sem confirmacao.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              <Metric value="4" label="acoes iniciais" />
              <Metric value="30d" label="contexto de prazos" />
              <Metric value="100%" label="confirmavel" />
            </div>
          </div>

          <div className="reveal-view reveal-delay-100">
            <AssistantPanel />
          </div>
        </div>
      </section>

      <section id="fluxo" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="reveal-view mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-normal text-blue-700">Fluxo</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
            Da aula ao plano, em tres movimentos.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {timeline.map((item, index) => (
            <article key={item.title} className={`reveal-view studypp-glow-card relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${index === 1 ? "reveal-delay-100" : index === 2 ? "reveal-delay-200" : ""}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                {index + 1}
              </div>
              <h3 className="mt-7 text-xl font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="mobile" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="reveal-view relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-950/10 sm:p-12">
          <BorderBeam />
          <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-black text-blue-800">
                <Bell className="h-4 w-4" />
                Pronto para web e mobile
              </div>
              <h2 className="max-w-2xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                Estuda online. Sincroniza quando voltar a internet.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                A arquitetura ja considera backup mobile offline-first, autenticacao propria e endpoints de sync. A landing mostra um produto com profundidade real.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="brand-button inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-black text-white">
                  Comecar agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-black text-slate-800 hover:border-blue-200 hover:text-blue-700">
                  Ja tenho conta
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-3">
              <div className="rounded-[1.2rem] bg-[#f7f9ff] p-4">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-950">Hoje</span>
                  <Clock3 className="h-4 w-4 text-blue-700" />
                </div>
                <PhoneRow icon={<FileText className="h-4 w-4" />} title="Apontamento criado" text="Biologia - Celulas" />
                <PhoneRow icon={<Target className="h-4 w-4" />} title="Objetivo atualizado" text="75% concluido" />
                <PhoneRow icon={<BookOpen className="h-4 w-4" />} title="Backup pendente" text="Sincroniza ao ligar" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductShowcase() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl rounded-[2rem] border border-slate-200 bg-white/85 p-2 shadow-2xl shadow-blue-950/10 backdrop-blur">
      <BorderBeam />
      <div className="rounded-[1.65rem] border border-slate-100 bg-slate-950 p-3">
        <div className="mb-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400">studypp.app/apontamentos</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)_300px]">
          <div className="rounded-2xl bg-white/[0.06] p-4 text-white">
            <div className="mb-5 flex items-center gap-2">
              <Image src="/brand/logo-mark.svg" alt="" width={30} height={34} className="object-contain" />
              <span className="font-black">Study++</span>
            </div>
            {["Dashboard", "Apontamentos", "Assistente", "Temporizador"].map((item, index) => (
              <div key={item} className={`mb-2 rounded-xl px-3 py-2 text-sm font-bold ${index === 1 ? "bg-white text-slate-950" : "text-slate-300"}`}>
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#f7f9ff] p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-blue-700">Preparacao para teste</p>
                <h2 className="mt-1 text-2xl font-black tracking-normal text-slate-950">Funcoes, limites e derivadas</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Guardado</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-4 text-sm font-black text-slate-900">Plano de revisao</p>
                {["Rever conceitos base", "Resolver exercicios guiados", "Fazer simulado curto"].map((item) => (
                  <div key={item} className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="mb-3 text-sm font-black text-blue-950">Sugestao contextual</p>
                <p className="text-sm leading-6 text-blue-900">Criar uma tarefa para praticar derivadas amanha as 18:00.</p>
                <div className="mt-4 inline-flex rounded-full bg-blue-900 px-3 py-2 text-xs font-black text-white">Confirmar acao</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5">
            <p className="text-sm font-black text-slate-950">Painel de hoje</p>
            <div className="mt-4 space-y-3">
              <MiniItem color="bg-blue-600" title="Matematica" text="Teste em 4 dias" />
              <MiniItem color="bg-violet-600" title="Foco" text="25 min concluidos" />
              <MiniItem color="bg-sky-500" title="Lembrete" text="Resumo pendente" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, children, index }: { icon: ReactNode; title: string; children: ReactNode; index: number }) {
  return (
    <article className={`reveal-view studypp-glow-card relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/5 ${index === 1 ? "reveal-delay-100" : index === 2 ? "reveal-delay-200" : index === 3 ? "reveal-delay-300" : ""}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
      <h3 className="mt-6 text-base font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{children}</p>
    </article>
  );
}

function AssistantPanel() {
  return (
    <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-2 shadow-2xl shadow-black/30 backdrop-blur">
      <BorderBeam />
      <div className="rounded-[1.6rem] bg-white p-5 text-slate-950">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black">Study++ IA</p>
              <p className="text-xs font-medium text-slate-500">Historico e acoes reais</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Online</span>
        </div>
        <div className="space-y-3">
          <Bubble side="left">Tenho prova de Fisica na sexta. Organiza o que devo fazer.</Bubble>
          <Bubble side="right">Cria uma tarefa para rever Cinematica amanha as 18h.</Bubble>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-normal text-blue-700">Criar tarefa</p>
            <p className="mt-1 text-sm font-black text-slate-950">Rever Cinematica</p>
            <p className="mt-1 text-xs font-medium text-slate-600">Amanha as 18:00 - Fisica</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-blue-900 px-3 py-2 text-xs font-black text-white">Confirmar</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">Ignorar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">{label}</p>
    </div>
  );
}

function PhoneRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="text-xs font-medium text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function MiniItem({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-xs font-medium text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function Bubble({ children, side }: { children: ReactNode; side: "left" | "right" }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <p className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6 ${side === "right" ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-700"}`}>
        {children}
      </p>
    </div>
  );
}

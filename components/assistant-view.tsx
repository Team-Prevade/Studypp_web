"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, History, Loader2, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import type { AssistantActionProposal } from "@/lib/assistant-action-types";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  actions?: AssistantActionProposal[];
  createdAt?: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

const suggestions = [
  "O que devo estudar hoje?",
  "Resume os meus próximos prazos.",
  "Ajuda-me a montar um plano de estudo para esta semana.",
  "Que tarefas estão a precisar de mais atenção?",
];

const welcomeMessage: Message = {
  role: "assistant",
  content:
    "Olá. Sou o teu assistente de estudo. Posso olhar para tarefas, calendário, objectivos, notas e apontamentos para te ajudar a decidir o próximo passo.",
};

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="mb-2 text-lg font-bold text-gray-900">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-3 text-base font-semibold text-gray-900">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold text-gray-900">{children}</h3>,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-gray-950">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-4 border-blue-200 bg-blue-50 px-3 py-2 text-gray-700">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-900">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-50">
            {children}
          </pre>
        ),
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline underline-offset-2">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="bg-gray-50 px-3 py-2 font-semibold text-gray-700">{children}</th>,
        td: ({ children }) => <td className="border-t border-gray-100 px-3 py-2 align-top">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function AssistantView() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá. Sou o teu assistente de estudo. Posso olhar para tarefas, calendário, objectivos, notas e apontamentos para te ajudar a decidir o próximo passo.",
    },
  ]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  // Keep a readable first paint even before history is loaded from the server.
  // The persisted chat history replaces this state as soon as a conversation is opened.
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [resolvedActions, setResolvedActions] = useState<Record<string, "done" | "dismissed">>({});

  const payloadMessages = useMemo(
    () => messages.filter((message) => message.content.trim()).slice(-8),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isLoading]);

  const refreshConversations = async () => {
    try {
      const response = await fetch("/api/ia/conversations");
      const data = (await response.json()) as {
        success?: boolean;
        conversations?: ConversationSummary[];
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Não foi possível carregar o histórico.");
      }
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar histórico.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    void refreshConversations();
  }, []);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([welcomeMessage]);
    setResolvedActions({});
    setInput("");
  };

  const loadConversation = async (conversationId: string) => {
    if (loadingConversationId || isLoading) return;
    setLoadingConversationId(conversationId);
    try {
      const response = await fetch(`/api/ia/conversations/${conversationId}`);
      const data = (await response.json()) as {
        success?: boolean;
        conversation?: { id: string; messages: Message[] };
        error?: string;
      };
      if (!response.ok || !data.success || !data.conversation) {
        throw new Error(data.error || "Não foi possível abrir a conversa.");
      }

      setActiveConversationId(data.conversation.id);
      setMessages(data.conversation.messages.length ? data.conversation.messages : [welcomeMessage]);
      setResolvedActions({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir conversa.");
    } finally {
      setLoadingConversationId(null);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm("Eliminar esta conversa do histórico?")) return;
    try {
      const response = await fetch(`/api/ia/conversations/${conversationId}`, { method: "DELETE" });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Não foi possível eliminar a conversa.");
      }

      setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
      if (activeConversationId === conversationId) startNewConversation();
      toast.success("Conversa eliminada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao eliminar conversa.");
    }
  };

  const sendMessage = async (content: string) => {
    const cleanContent = content.trim();
    if (!cleanContent || isLoading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: cleanContent }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          messages: [...payloadMessages, { role: "user", content: cleanContent }],
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        actions?: AssistantActionProposal[];
        conversationId?: string;
        conversationTitle?: string;
        error?: string;
        provider?: string;
      };

      if (!response.ok || !data.success || !data.message) {
        throw new Error(data.error || "Não foi possível contactar o assistente.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.message ?? "", actions: Array.isArray(data.actions) ? data.actions : [] },
      ]);
      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
        setConversations((current) => {
          const existing = current.find((conversation) => conversation.id === data.conversationId);
          const next: ConversationSummary = {
            id: data.conversationId!,
            title: data.conversationTitle || existing?.title || cleanContent.slice(0, 44) || "Nova conversa",
            preview: data.message || cleanContent,
            messageCount: (existing?.messageCount || 0) + 2,
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return [next, ...current.filter((conversation) => conversation.id !== next.id)];
        });
      }
      if (data.provider === "fallback") {
        toast.info("IA ainda sem chave configurada. A mostrar resposta de fallback.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao falar com o assistente.";
      toast.error(message);
      setMessages((current) => [...current, { role: "assistant", content: "Não consegui responder agora. Tenta novamente daqui a pouco." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const executeAction = async (action: AssistantActionProposal) => {
    if (executingActionId) return;
    setExecutingActionId(action.id);
    try {
      const response = await fetch("/api/ia/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Nao foi possivel executar a acao.");
      }

      setResolvedActions((current) => ({ ...current, [action.id]: "done" }));
      toast.success(data.message || "Acao executada.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `${data.message || "Acao executada."} Podes ver o resultado na area correspondente.`,
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao executar acao.");
    } finally {
      setExecutingActionId(null);
    }
  };

  const dismissAction = (actionId: string) => {
    setResolvedActions((current) => ({ ...current, [actionId]: "dismissed" }));
  };

  return (
    <main className="h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 px-4 py-4 sm:px-6 lg:h-screen lg:px-8">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 overflow-hidden">
        <header className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              <Sparkles className="h-4 w-4" />
              Assistente IA
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Assistente de estudo</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Pergunta sobre prioridades, planos de estudo, apontamentos e próximos prazos. Quando fizer sentido, ele prepara ações para confirmares antes de gravar.
            </p>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Study++ IA</p>
                  <p className="text-xs text-gray-500">Contexto académico, leitura segura e sugestões práticas</p>
                </div>
              </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50/70 px-5 py-5">
              {messages.map((message, index) => (
                <div key={message.id || `${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-md bg-blue-900 text-white"
                        : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="space-y-3">
                        <AssistantMarkdown content={message.content} />
                        {message.actions?.length ? (
                          <div className="space-y-2">
                            {message.actions.map((action) => (
                              <ActionCard
                                key={action.id}
                                action={action}
                                status={resolvedActions[action.id]}
                                isExecuting={executingActionId === action.id}
                                onConfirm={() => void executeAction(action)}
                                onDismiss={() => dismissAction(action.id)}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A analisar o teu contexto...
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-100 bg-white p-4">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Pergunta ao assistente..."
                  className="min-h-12 flex-1 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                  aria-label="Enviar mensagem"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </div>

          <aside className="hidden min-h-0 space-y-4 overflow-y-auto lg:block">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <History className="h-4 w-4 text-blue-700" />
                  Histórico
                </h2>
                <button
                  type="button"
                  onClick={startNewConversation}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova
                </button>
              </div>

              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {isHistoryLoading ? (
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    A carregar...
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
                    Ainda não há conversas guardadas.
                  </p>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group flex items-start gap-2 rounded-lg border p-2 transition ${
                        activeConversationId === conversation.id
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-100 bg-white hover:border-blue-100 hover:bg-blue-50/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void loadConversation(conversation.id)}
                        disabled={Boolean(loadingConversationId)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-semibold text-gray-900">{conversation.title}</span>
                        <span className="mt-1 block truncate text-xs text-gray-500">{conversation.preview || "Sem mensagens"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteConversation(conversation.id)}
                        className="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        aria-label="Eliminar conversa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Começar rápido</h2>
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h2 className="text-sm font-semibold text-blue-950">O que ele já consulta</h2>
              <ul className="mt-3 space-y-2 text-sm text-blue-900">
                <li>Tarefas, eventos e lembretes próximos</li>
                <li>Disciplinas e perfil académico</li>
                <li>Notas, avaliações e objectivos</li>
                <li>Apontamentos recentes e fixados</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function actionName(type: AssistantActionProposal["type"]) {
  if (type === "create_task") return "Criar tarefa";
  if (type === "create_event") return "Criar evento";
  if (type === "create_reminder") return "Criar lembrete";
  return "Criar disciplina";
}

function payloadRows(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .slice(0, 6);
}

function ActionCard({
  action,
  status,
  isExecuting,
  onConfirm,
  onDismiss,
}: {
  action: AssistantActionProposal;
  status?: "done" | "dismissed";
  isExecuting: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const rows = payloadRows(action.payload);
  const disabled = Boolean(status) || isExecuting;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{actionName(action.type)}</p>
          <h3 className="mt-1 text-sm font-semibold text-gray-950">{action.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{action.summary}</p>
        </div>
        {status === "done" ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Criado</span>
        ) : status === "dismissed" ? (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">Ignorado</span>
        ) : null}
      </div>

      {rows.length ? (
        <dl className="mt-3 grid gap-1.5 rounded-lg bg-white/80 p-2 text-xs">
          {rows.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
              <dt className="capitalize text-gray-400">{key.replace(/([A-Z])/g, " $1")}</dt>
              <dd className="truncate font-medium text-gray-700">{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Confirmar
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Ignorar
        </button>
      </div>
    </div>
  );
}

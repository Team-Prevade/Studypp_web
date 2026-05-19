"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  CheckSquare,
  Code2,
  Copy,
  FileText,
  Heading2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  NotebookText,
  Paperclip,
  Pin,
  Plus,
  Quote,
  Save,
  Search,
  Share2,
  Trash2,
  Underline as UnderlineIcon,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createApontamentoAction,
  deleteApontamentoAction,
  togglePinApontamentoAction,
  updateApontamentoAction,
} from "@/lib/apontamentos-actions";

interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

interface Apontamento {
  id: string;
  titulo: string;
  conteudo?: string | null;
  tipo?: string;
  parent?: { id: string; titulo: string } | null;
  subNotas?: Array<{ id: string; titulo: string; updatedAt: string }>;
  aula?: {
    id: string;
    horaInicio: string;
    horaFim: string;
    disciplina: { nome: string; cor: string };
  } | null;
  tarefa?: { id: string; titulo: string; prazo?: string | null; status: string } | null;
  fixado: boolean;
  createdAt: string;
  updatedAt: string;
  disciplina?: Disciplina | null;
}

interface ApontamentosViewProps {
  apontamentos: Apontamento[];
  disciplinas: Disciplina[];
  aulas?: Array<{
    id: string;
    horaInicio: string;
    horaFim: string;
    disciplina: { nome: string; cor: string };
  }>;
  tarefas?: Array<{
    id: string;
    titulo: string;
    prazo?: string | null;
    disciplina?: { nome: string; cor: string } | null;
  }>;
  initialSelectedId?: string;
}

type SortMode = "recentes" | "alfabetica" | "disciplina";
type SaveState = "idle" | "dirty" | "saving";
type SharePermission = "READ" | "WRITE";
type ShareVisibility = "PRIVATE" | "PUBLIC";

type ShareState = {
  id: string;
  token: string;
  enabled: boolean;
  visibility: ShareVisibility;
  publicPermission: SharePermission;
  participants: Array<{
    id: string;
    permission: SharePermission;
    utilizador: { id: string; nome: string; email: string };
  }>;
} | null;

const emptyContent = "<p></p>";
const lowlight = createLowlight(common);
const codeLanguages = [
  { value: "plaintext", label: "Texto" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "tsx", label: "TSX" },
  { value: "jsx", label: "JSX" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "markdown", label: "Markdown" },
];
const fileLimits = {
  image: 5 * 1024 * 1024,
  pdf: 12 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 60 * 1024 * 1024,
};
const noteTypes = ["LIVRE", "RESUMO", "TPC", "ESTUDO", "EXAME", "PROJECTO"];
const noteTypeLabels: Record<string, string> = {
  LIVRE: "Livre",
  RESUMO: "Resumo",
  TPC: "TPC",
  ESTUDO: "Estudo",
  EXAME: "Exame",
  PROJECTO: "Projecto",
};

const studyBlocks = [
  {
    kind: "summary",
    label: "Resumo",
    title: "Resumo",
    placeholder: "Sintetiza a ideia principal em 2 ou 3 frases.",
  },
  {
    kind: "definition",
    label: "Definição",
    title: "Definição",
    placeholder: "Escreve o termo e a explicação essencial.",
  },
  {
    kind: "formula",
    label: "Fórmula",
    title: "Fórmula",
    placeholder: "Regista a fórmula, variáveis e quando usar.",
  },
  {
    kind: "example",
    label: "Exemplo",
    title: "Exemplo",
    placeholder: "Mostra um caso prático ou exercício resolvido.",
  },
  {
    kind: "question",
    label: "Dúvida",
    title: "Dúvida",
    placeholder: "Escreve a dúvida para rever depois.",
  },
];

const NoteReference = Node.create({
  name: "noteReference",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      id: { default: null },
      label: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-note-ref]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-note-ref": HTMLAttributes.id,
        href: `/apontamentos/${HTMLAttributes.id}`,
        class:
          "inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 no-underline hover:bg-blue-100",
      }),
      `@${HTMLAttributes.label || "nota"}`,
    ];
  },
});

const StudyBlock = Node.create({
  name: "studyBlock",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      kind: { default: "summary" },
      title: { default: "Bloco de estudo" },
    };
  },
  parseHTML() {
    return [{ tag: "section[data-study-block]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-study-block": HTMLAttributes.kind,
        class: "study-block",
      }),
      [
        "div",
        {
          class: "study-block__label",
          contenteditable: "false",
        },
        HTMLAttributes.title || "Bloco de estudo",
      ],
      ["div", { class: "study-block__content" }, 0],
    ];
  },
});

const AttachmentBlock = Node.create({
  name: "attachmentBlock",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      href: { default: "" },
      title: { default: "Anexo" },
      description: { default: "" },
      kind: { default: "file" },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-attachment-block]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const labels: Record<string, string> = {
      pdf: "PDF",
      audio: "AUDIO",
      video: "VIDEO",
      file: "FILE",
    };
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-attachment-block": HTMLAttributes.kind,
        href: HTMLAttributes.href,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "attachment-block",
      }),
      ["span", { class: "attachment-block__icon" }, labels[HTMLAttributes.kind] || "FILE"],
      [
        "span",
        { class: "attachment-block__body" },
        ["span", { class: "attachment-block__title" }, HTMLAttributes.title || "Anexo"],
        ["span", { class: "attachment-block__url" }, HTMLAttributes.description || HTMLAttributes.href || ""],
      ],
    ];
  },
});

function studyBlockHtml(kind: string, title: string, content: string) {
  return `<section data-study-block="${kind}" kind="${kind}" title="${title}"><div class="study-block__label" contenteditable="false">${title}</div><div class="study-block__content"><p>${content}</p></div></section>`;
}

const templates = [
  {
    id: "resumo",
    title: "Resumo de aula",
    description: "Conceitos, exemplos e dúvidas num formato claro.",
    icon: FileText,
    content: (subject: string) =>
      `<h1>Resumo - ${subject || "Disciplina"}</h1>${studyBlockHtml("summary", "Resumo", "Ideia principal da aula.")}<h2>Conceitos principais</h2><ul><li></li></ul>${studyBlockHtml("example", "Exemplo", "Exemplo importante para memorizar.")}${studyBlockHtml("question", "Duvida", "Pergunta para esclarecer depois.")}`,
  },
  {
    id: "teste",
    title: "Preparação para teste",
    description: "Checklist de tópicos, fórmulas e erros a evitar.",
    icon: ListChecks,
    content: (subject: string) =>
      `<h1>Preparacao - ${subject || "Disciplina"}</h1><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Topico a rever</p></div></li></ul>${studyBlockHtml("formula", "Formula", "Formula importante e quando aplicar.")}<h2>Erros a evitar</h2><ul><li></li></ul>`,
  },
  {
    id: "ficha",
    title: "Ficha de estudo",
    description: "Teoria, exercícios resolvidos e prática.",
    icon: CheckSquare,
    content: () =>
      `<h1>Ficha de estudo</h1>${studyBlockHtml("definition", "Definicao", "Conceito central.")}<h2>Exercicios resolvidos</h2>${studyBlockHtml("example", "Exemplo", "Resolucao passo a passo.")}<h2>Exercicios para praticar</h2><ul><li></li></ul>`,
  },
  {
    id: "aula",
    title: "Apontamentos de aula",
    description: "O que foi dado e o que estudar em casa.",
    icon: Heading2,
    content: () =>
      `<h1>Apontamentos - ${new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" }).format(new Date())}</h1><h2>O que foi dado</h2><ul><li></li></ul>${studyBlockHtml("summary", "Resumo", "Resumo rapido da aula.")}<h2>Para estudar em casa</h2><p></p>`,
  },
  {
    id: "livre",
    title: "Nota livre",
    description: "Começa com uma página em branco.",
    icon: Plus,
    content: () => emptyContent,
  },
];

function normalizeNote(input: any): Apontamento {
  return {
    ...input,
    conteudo: input.conteudo ?? "",
    disciplina: input.disciplina ?? null,
    createdAt: new Date(input.createdAt).toISOString(),
    updatedAt: new Date(input.updatedAt).toISOString(),
  };
}

function textOnly(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sortNotes(notes: Apontamento[], mode: SortMode) {
  return [...notes].sort((a, b) => {
    if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
    if (mode === "alfabetica") return a.titulo.localeCompare(b.titulo, "pt-PT");
    if (mode === "disciplina") {
      return (a.disciplina?.nome || "Sem disciplina").localeCompare(
        b.disciplina?.nome || "Sem disciplina",
        "pt-PT",
      );
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function extractHeadings(html: string) {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return Array.from(doc.querySelectorAll("h2, h3")).map((node, index) => ({
    id: `${node.tagName}-${index}`,
    text: node.textContent || "Secção sem título",
    level: node.tagName === "H2" ? 2 : 3,
  }));
}

export function ApontamentosView(props: ApontamentosViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <ApontamentosSkeleton />;
  }

  return <ApontamentosClientView {...props} />;
}

function ApontamentosClientView({
  apontamentos,
  disciplinas,
  aulas = [],
  tarefas = [],
  initialSelectedId,
}: ApontamentosViewProps) {
  const initialItems = useMemo(() => sortNotes(apontamentos.map(normalizeNote), "recentes"), [apontamentos]);
  const initialSelected = useMemo(
    () =>
      initialSelectedId && initialItems.some((item) => item.id === initialSelectedId)
        ? initialSelectedId
        : initialItems[0]?.id ?? null,
    [initialItems, initialSelectedId],
  );
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todas");
  const [sortMode, setSortMode] = useState<SortMode>("recentes");
  const [templateOpen, setTemplateOpen] = useState(false);
  const firstSelected = initialItems.find((item) => item.id === initialSelected) ?? initialItems[0] ?? null;
  const [title, setTitle] = useState(firstSelected?.titulo ?? "");
  const [disciplinaId, setDisciplinaId] = useState(firstSelected?.disciplina?.id ?? "");
  const [tipo, setTipo] = useState(firstSelected?.tipo ?? "LIVRE");
  const [parentId, setParentId] = useState(firstSelected?.parent?.id ?? "");
  const [aulaId, setAulaId] = useState(firstSelected?.aula?.id ?? "");
  const [tarefaId, setTarefaId] = useState(firstSelected?.tarefa?.id ?? "");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(firstSelected?.updatedAt ?? null);
  const [shareOpen, setShareOpen] = useState(false);
  const [share, setShare] = useState<ShareState>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantPermission, setParticipantPermission] = useState<SharePermission>("READ");

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Escreve aqui. Usa títulos, listas e checklists para organizar o estudo." }),
      Underline,
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "note-image",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({
        defaultLanguage: "plaintext",
        lowlight,
      }),
      NoteReference,
      StudyBlock,
      AttachmentBlock,
    ],
    content: selected?.conteudo || emptyContent,
    editorProps: {
      attributes: {
        class: "studypp-note-editor min-h-[calc(100vh-280px)] outline-none",
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("[data-note-ref]") as HTMLElement | null;
        const noteId = link?.dataset.noteRef;
        if (!noteId) return false;

        event.preventDefault();
        selectNote(noteId);
        return true;
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      setSaveState("dirty");
      const { state } = activeEditor;
      const { $from } = state.selection;
      const textBeforeCursor = $from.parent.textContent.slice(0, $from.parentOffset);
      const match = textBeforeCursor.match(/@([\p{L}\p{N}\s_-]{0,40})$/u);
      setMentionQuery(match ? match[1].trimStart() : null);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!selected) {
      setTitle("");
      setDisciplinaId("");
      setTipo("LIVRE");
      setParentId("");
      setAulaId("");
      setTarefaId("");
      editor?.commands.setContent(emptyContent, { emitUpdate: false });
      return;
    }

    setTitle(selected.titulo);
    setDisciplinaId(selected.disciplina?.id ?? "");
    setTipo(selected.tipo ?? "LIVRE");
    setParentId(selected.parent?.id ?? "");
    setAulaId(selected.aula?.id ?? "");
    setTarefaId(selected.tarefa?.id ?? "");
    setLastSavedAt(selected.updatedAt);
    setSaveState("idle");
    editor?.commands.setContent(selected.conteudo || emptyContent, { emitUpdate: false });
  }, [editor, selected]);

  useEffect(() => {
    setItems((current) => sortNotes(current, sortMode));
  }, [sortMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCurrentNote();
      }

      if (event.key === "Escape") {
        setMentionQuery(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/\/apontamentos\/([^/]+)/);
      const noteId = match?.[1];
      if (noteId && items.some((item) => item.id === noteId)) {
        setSelectedId(noteId);
      }
      if (!noteId) {
        setSelectedId(items[0]?.id ?? null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [items]);

  useEffect(() => {
    if (!selected || saveState !== "idle") return;

    let cancelled = false;
    const refreshSelected = async () => {
      try {
        const response = await fetch(`/api/apontamentos/${selected.id}`, {
          cache: "no-store",
        });
        const result = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              apontamento?: {
                id: string;
                titulo: string;
                conteudo: string | null;
                updatedAt: string;
              };
            }
          | null;

        if (cancelled || !response.ok || !result?.success || !result.apontamento) return;

        const remote = result.apontamento;
        const remoteUpdatedAt = new Date(remote.updatedAt).getTime();
        const localUpdatedAt = new Date(selected.updatedAt).getTime();
        if (!Number.isFinite(remoteUpdatedAt) || remoteUpdatedAt <= localUpdatedAt) return;

        setItems((current) =>
          sortNotes(
            current.map((item) =>
              item.id === remote.id
                ? {
                    ...item,
                    titulo: remote.titulo,
                    conteudo: remote.conteudo,
                    updatedAt: remote.updatedAt,
                  }
                : item,
            ),
            sortMode,
          ),
        );
        setTitle(remote.titulo);
        setLastSavedAt(remote.updatedAt);
        editor?.commands.setContent(remote.conteudo || emptyContent, { emitUpdate: false });
      } catch {
        // Silent polling keeps navigation/editor feedback calm when the connection is intermittent.
      }
    };

    const interval = window.setInterval(refreshSelected, 1800);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [editor, saveState, selected, sortMode]);

  // Do not reintroduce autosave here unless the user explicitly asks for it.
  // Manual save avoids edit conflicts between title, subject changes, and rich editor updates.
  const saveCurrentNote = async () => {
    if (!selected || !editor) return;

    setSaveState("saving");
    const result = await updateApontamentoAction(selected.id, {
      titulo: title.trim() || "Sem título",
      conteudo: editor.getHTML(),
      disciplinaId: disciplinaId || null,
      tipo,
      parentId: parentId || null,
      aulaId: aulaId || null,
      tarefaId: tarefaId || null,
      fixado: selected.fixado,
    });

    if (!result.success || !result.data) {
      toast.error(result.error || "Não foi possível guardar o apontamento.");
      setSaveState("dirty");
      return;
    }

    const saved = normalizeNote(result.data);
    setItems((current) =>
      sortNotes(current.map((item) => (item.id === saved.id ? saved : item)), sortMode),
    );
    setLastSavedAt(saved.updatedAt);
    setSaveState("idle");
    toast.success("Apontamento guardado.");
  };

  const visibleNotes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sortNotes(items, sortMode).filter((note) => {
      const matchesSearch =
        !needle ||
        note.titulo.toLowerCase().includes(needle) ||
        textOnly(note.conteudo).toLowerCase().includes(needle);
      const matchesFilter =
        filter === "todas" ||
        (filter === "fixadas" && note.fixado) ||
        note.disciplina?.id === filter;
      return matchesSearch && matchesFilter;
    });
  }, [filter, items, search, sortMode]);

  const headings = useMemo(() => extractHeadings(editor?.getHTML() || selected?.conteudo || ""), [editor, selected?.conteudo, saveState]);
  const selectedDisciplina = disciplinas.find((disciplina) => disciplina.id === disciplinaId) ?? null;
  const parentOptions = items.filter((note) => note.id !== selected?.id);
  const mentionOptions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return items
      .filter((note) => note.id !== selected?.id)
      .filter((note) => !query || note.titulo.toLowerCase().includes(query))
      .slice(0, 6);
  }, [items, mentionQuery, selected?.id]);

  const selectNote = (noteId: string) => {
    setSelectedId(noteId);
    setMentionQuery(null);
    window.history.pushState(null, "", `/apontamentos/${noteId}`);
  };

  const templateType = (templateId: string) => {
    if (templateId === "resumo") return "RESUMO";
    if (templateId === "teste") return "EXAME";
    if (templateId === "ficha" || templateId === "aula") return "ESTUDO";
    return "LIVRE";
  };

  const insertNoteReference = (note: Apontamento) => {
    if (!editor) return;

    const { state } = editor;
    const { from, $from } = state.selection;
    const textBeforeCursor = $from.parent.textContent.slice(0, $from.parentOffset);
    const match = textBeforeCursor.match(/@([\p{L}\p{N}\s_-]{0,40})$/u);
    const deleteFrom = match ? from - match[0].length : from;

    editor
      .chain()
      .focus()
      .deleteRange({ from: deleteFrom, to: from })
      .insertContent([
        {
          type: "noteReference",
          attrs: {
            id: note.id,
            label: note.titulo || "Sem tÃ­tulo",
          },
        },
        { type: "text", text: " " },
      ])
      .run();
    setMentionQuery(null);
  };

  const createFromTemplate = async (template: (typeof templates)[number]) => {
    const content = template.content(selectedDisciplina?.nome || disciplinas[0]?.nome || "");
    const result = await createApontamentoAction({
      titulo: "Sem título",
      conteudo: content,
      disciplinaId: disciplinaId || disciplinas[0]?.id || null,
      tipo: templateType(template.id),
      fixado: false,
    });

    if (!result.success || !result.data) {
      toast.error(result.error || "Não foi possível criar o apontamento.");
      return;
    }

    const note = normalizeNote(result.data);
    setItems((current) => sortNotes([note, ...current], sortMode));
    selectNote(note.id);
    setTemplateOpen(false);
    toast.success("Apontamento criado.");
    window.setTimeout(() => {
      const input = document.getElementById("note-title-input");
      input?.focus();
    }, 50);
  };

  const createSubNote = async (parent: Apontamento) => {
    const result = await createApontamentoAction({
      titulo: "Sub-nota",
      conteudo: emptyContent,
      disciplinaId: parent.disciplina?.id || null,
      tipo: "LIVRE",
      parentId: parent.id,
      fixado: false,
    });

    if (!result.success || !result.data) {
      toast.error(result.error || "NÃ£o foi possÃ­vel criar a sub-nota.");
      return;
    }

    const note = normalizeNote(result.data);
    setItems((current) =>
      sortNotes(
        current
          .map((item) =>
            item.id === parent.id
              ? {
                  ...item,
                  subNotas: [
                    { id: note.id, titulo: note.titulo, updatedAt: note.updatedAt },
                    ...(item.subNotas || []),
                  ],
                }
              : item,
          )
          .concat(note),
        sortMode,
      ),
    );
    selectNote(note.id);
    toast.success("Sub-nota criada.");
  };

  const deleteSelected = async (note: Apontamento) => {
    if (!window.confirm(`Eliminar "${note.titulo}"?`)) return;

    const previous = items;
    const next = items.filter((item) => item.id !== note.id);
    setItems(next);
    if (next[0]) {
      selectNote(next[0].id);
    } else {
      setSelectedId(null);
      window.history.pushState(null, "", "/apontamentos");
    }

    const result = await deleteApontamentoAction(note.id);
    if (!result.success) {
      setItems(previous);
      setSelectedId(note.id);
      toast.error(result.error || "Não foi possível eliminar o apontamento.");
      return;
    }

    toast.success("Apontamento eliminado.");
  };

  const togglePin = async (note: Apontamento) => {
    const result = await togglePinApontamentoAction(note.id);
    if (!result.success || !result.data) {
      toast.error(result.error || "Não foi possível fixar o apontamento.");
      return;
    }

    const updated = normalizeNote(result.data);
    setItems((current) =>
      sortNotes(current.map((item) => (item.id === updated.id ? updated : item)), sortMode),
    );
    toast.success(updated.fixado ? "Apontamento fixado." : "Apontamento removido dos fixados.");
  };

  const shareUrl =
    typeof window !== "undefined" && share?.token
      ? `${window.location.origin}/share/apontamentos/${share.token}`
      : "";

  const loadShare = async (note: Apontamento) => {
    setShareOpen(true);
    setShareLoading(true);

    try {
      const response = await fetch(`/api/apontamentos/${note.id}/share`);
      const result = (await response.json()) as { success: boolean; share: ShareState; error?: string };

      if (!response.ok || !result.success) {
        toast.error(result.error || "Nao foi possivel carregar a partilha.");
        return;
      }

      setShare(result.share);
    } finally {
      setShareLoading(false);
    }
  };

  const updateShare = async (patch: Partial<NonNullable<ShareState>>) => {
    if (!selected) return;
    setShareLoading(true);

    const next = {
      enabled: patch.enabled ?? share?.enabled ?? true,
      visibility: patch.visibility ?? share?.visibility ?? "PRIVATE",
      publicPermission: patch.publicPermission ?? share?.publicPermission ?? "READ",
    };

    try {
      const response = await fetch(`/api/apontamentos/${selected.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const result = (await response.json()) as { success: boolean; share: ShareState; error?: string };

      if (!response.ok || !result.success) {
        toast.error(result.error || "Nao foi possivel atualizar a partilha.");
        return;
      }

      setShare(result.share);
      toast.success("Partilha atualizada.");
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copiado.");
  };

  const addParticipant = async () => {
    if (!selected || !participantEmail.trim()) return;
    setShareLoading(true);

    try {
      const response = await fetch(`/api/apontamentos/${selected.id}/share/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: participantEmail,
          permission: participantPermission,
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        participant?: NonNullable<ShareState>["participants"][number];
        error?: string;
      };

      if (!response.ok || !result.success || !result.participant) {
        toast.error(result.error || "Nao foi possivel adicionar o utilizador.");
        return;
      }

      const participant = result.participant;
      setShare((current) =>
        current
          ? {
              ...current,
              participants: [
                ...current.participants.filter((item) => item.id !== participant.id),
                participant,
              ],
            }
          : current,
      );
      setParticipantEmail("");
      toast.success("Utilizador autorizado.");
    } finally {
      setShareLoading(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!selected) return;

    const response = await fetch(`/api/apontamentos/${selected.id}/share/participants/${participantId}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { success: boolean; error?: string };

    if (!response.ok || !result.success) {
      toast.error(result.error || "Nao foi possivel remover o acesso.");
      return;
    }

    setShare((current) =>
      current
        ? {
            ...current,
            participants: current.participants.filter((item) => item.id !== participantId),
          }
        : current,
    );
    toast.success("Acesso removido.");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900 lg:flex-row">
      <aside className="flex max-h-[42vh] w-full shrink-0 flex-col border-b border-gray-200 bg-white lg:h-screen lg:max-h-none lg:w-[280px] lg:border-b-0 lg:border-r">
        <div className="space-y-4 border-b border-gray-200 p-4">
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nova nota
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar notas..."
              aria-label="Pesquisar apontamentos"
              className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill active={filter === "todas"} onClick={() => setFilter("todas")} label="Todas" />
            <FilterPill active={filter === "fixadas"} onClick={() => setFilter("fixadas")} label="Fixadas" />
            {disciplinas.slice(0, 4).map((disciplina) => (
              <FilterPill
                key={disciplina.id}
                active={filter === disciplina.id}
                onClick={() => setFilter(disciplina.id)}
                label={disciplina.nome}
                color={disciplina.cor}
              />
            ))}
          </div>

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="Ordenar apontamentos"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="recentes">Recentes</option>
            <option value="alfabetica">Alfabética</option>
            <option value="disciplina">Por disciplina</option>
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {visibleNotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">Sem apontamentos</p>
              <p className="mt-1 text-xs text-gray-500">Cria uma nota para começar.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {visibleNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => selectNote(note.id)}
                  className={`group w-full rounded-lg border-l-4 px-3 py-3 text-left transition-colors duration-150 ${
                    selectedId === note.id
                      ? "border-l-blue-600 bg-blue-100"
                      : "border-l-transparent hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{note.titulo || "Sem título"}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        {note.disciplina ? (
                          <>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: note.disciplina.cor }} />
                            <span className="truncate">{note.disciplina.nome}</span>
                          </>
                        ) : (
                          <span>Sem disciplina</span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500">{textOnly(note.conteudo) || "Nota vazia"}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(note.updatedAt)}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {noteTypeLabels[note.tipo || "LIVRE"] || "Livre"}
                        </span>
                      </div>
                      {note.subNotas?.length ? (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                          <NotebookText className="h-3.5 w-3.5" />
                          {note.subNotas.length} sub-notas
                        </div>
                      ) : null}
                    </div>
                    <Pin className={`h-4 w-4 ${note.fixado ? "fill-blue-600 text-blue-600" : "text-gray-400"}`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white">
        {selected && editor ? (
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mb-4">
              <input
                id="note-title-input"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setSaveState("dirty");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    editor.commands.focus("start");
                  }
                }}
                placeholder="Sem título"
                className="w-full border-0 bg-transparent text-3xl font-bold text-gray-900 outline-none placeholder:text-gray-400"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <select
                  value={disciplinaId}
                  onChange={(event) => {
                    setDisciplinaId(event.target.value);
                    setSaveState("dirty");
                  }}
                  aria-label="Disciplina do apontamento"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem disciplina</option>
                  {disciplinas.map((disciplina) => (
                    <option key={disciplina.id} value={disciplina.id}>
                      {disciplina.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={tipo}
                  onChange={(event) => {
                    setTipo(event.target.value);
                    setSaveState("dirty");
                  }}
                  aria-label="Tipo do apontamento"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  {noteTypes.map((noteType) => (
                    <option key={noteType} value={noteType}>
                      {noteTypeLabels[noteType]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => togglePin(selected)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pin className={`h-4 w-4 ${selected.fixado ? "fill-blue-600 text-blue-600" : ""}`} />
                  {selected.fixado ? "Fixada" : "Fixar"}
                </button>

                <div className="flex w-full flex-wrap items-center gap-3 text-xs text-gray-400 lg:ml-auto lg:w-auto">
                  <span className="min-w-[140px]">{saveState === "saving"
                    ? "A guardar..."
                    : saveState === "dirty"
                      ? "Alterações por guardar"
                      : lastSavedAt
                        ? `Guardado às ${formatDate(lastSavedAt).split(",").pop()?.trim()}`
                        : ""}</span>
                  <button
                    type="button"
                    onClick={() => loadShare(selected)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Share2 className="h-4 w-4" />
                    Partilhar
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentNote}
                    disabled={saveState === "saving"}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {saveState === "saving" ? "A guardar..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSelected(selected)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Apagar
                  </button>
                </div>
              </div>
            </div>

            <NoteToolbar editor={editor} />
            <div className="relative">
              {mentionQuery !== null ? (
                <div className="absolute left-4 top-4 z-20 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5">
                  <div className="border-b border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Referenciar nota</p>
                    <p className="mt-0.5 truncate text-sm text-gray-700">@{mentionQuery || "procurar apontamento"}</p>
                  </div>
                  {mentionOptions.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-gray-500">Nenhuma nota encontrada.</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto p-2">
                      {mentionOptions.map((note) => (
                        <button
                          key={note.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            insertNoteReference(note);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-blue-50"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: note.disciplina?.cor || "#2563eb" }}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900">
                              {note.titulo || "Sem tÃ­tulo"}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {note.disciplina?.nome || "Sem disciplina"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h2 className="text-base font-medium text-gray-900">Seleciona uma nota</h2>
              <p className="mt-2 text-sm text-gray-500">Escolhe um apontamento ou cria um novo a partir de um template.</p>
              <button
                type="button"
                onClick={() => setTemplateOpen(true)}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Criar nota
              </button>
            </div>
          </div>
        )}
      </main>

      <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5 xl:block">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Contexto</h2>
          {selected ? (
            <button
              type="button"
              onClick={() => deleteSelected(selected)}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar apontamento"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Metadados</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-400">Disciplina</dt>
              <dd className="mt-1 text-gray-700">{selected?.disciplina?.nome || "Sem disciplina"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Última edição</dt>
              <dd className="mt-1 text-gray-700">{selected ? formatDate(selected.updatedAt) : "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Estado</dt>
              <dd className="mt-1 text-gray-700">{selected?.fixado ? "Fixada" : "Normal"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Tipo</dt>
              <dd className="mt-1 text-gray-700">{noteTypeLabels[selected?.tipo || "LIVRE"] || "Livre"}</dd>
            </div>
            {selected?.parent ? (
              <div>
                <dt className="text-xs text-gray-400">Sub-nota de</dt>
                <dd className="mt-1">
                  <button
                    type="button"
                    onClick={() => selectNote(selected.parent!.id)}
                    className="text-left text-blue-700 hover:text-blue-800"
                  >
                    {selected.parent.titulo || "Sem tÃ­tulo"}
                  </button>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">LigaÃ§Ãµes</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-gray-400">Nota principal (hierarquia)</span>
              <select
                value={parentId}
                onChange={(event) => {
                  setParentId(event.target.value);
                  setSaveState("dirty");
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma</option>
                {parentOptions.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.titulo || "Sem tÃ­tulo"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-400">Aula de hoje</span>
              <select
                value={aulaId}
                onChange={(event) => {
                  setAulaId(event.target.value);
                  setSaveState("dirty");
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem aula ligada</option>
                {aulas.map((aula) => (
                  <option key={aula.id} value={aula.id}>
                    {aula.disciplina.nome} - {aula.horaInicio}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-gray-400">Tarefa pendente</span>
              <select
                value={tarefaId}
                onChange={(event) => {
                  setTarefaId(event.target.value);
                  setSaveState("dirty");
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem tarefa ligada</option>
                {tarefas.map((tarefa) => (
                  <option key={tarefa.id} value={tarefa.id}>
                    {tarefa.titulo}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Sub-notas</h3>
            {selected ? (
              <button
                type="button"
                onClick={() => createSubNote(selected)}
                className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-50"
                aria-label="Criar sub-nota"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {!selected?.subNotas?.length ? (
            <p className="text-sm text-gray-500">Sem sub-notas.</p>
          ) : (
            <div className="space-y-2">
              {selected.subNotas.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => selectNote(note.id)}
                  className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left hover:bg-blue-50"
                >
                  <p className="truncate text-sm font-medium text-gray-800">{note.titulo || "Sem tÃ­tulo"}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(note.updatedAt)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Índice</h3>
          {headings.length === 0 ? (
            <p className="text-sm text-gray-500">Usa títulos 2 e 3 para gerar o índice.</p>
          ) : (
            <nav className="space-y-2">
              {headings.map((heading) => (
                <p
                  key={heading.id}
                  className={`truncate text-sm text-gray-600 ${heading.level === 3 ? "pl-4" : ""}`}
                >
                  {heading.text}
                </p>
              ))}
            </nav>
          )}
        </section>
      </aside>

      {templateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Começar com um template</h2>
              <p className="mt-1 text-sm text-gray-500">Escolhe uma estrutura e adapta-a ao teu estudo.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => createFromTemplate(template)}
                    className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors duration-150 hover:bg-blue-50"
                  >
                    <Icon className="mb-3 h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{template.description}</p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => createFromTemplate(templates[4])}
              className="mt-5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-1.5"
            >
              Começar em branco
            </button>
          </div>
        </div>
      ) : null}

      {shareOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Partilhar apontamento</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Controla quem pode abrir e editar &ldquo;{selected.titulo || "Sem titulo"}&rdquo;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fechar partilha"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {shareLoading && !share ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">A preparar partilha...</p>
            ) : (
              <div className="space-y-5">
                <section className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Link de partilha</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Desativa o link a qualquer momento para revogar o acesso externo.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={share?.enabled ?? false}
                        onChange={(event) => updateShare({ enabled: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Link ativo
                    </label>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      value={shareUrl}
                      readOnly
                      placeholder="Ativa a partilha para gerar o link"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={copyShareLink}
                      disabled={!shareUrl}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Link2 className="h-4 w-4" />
                      Copiar
                    </button>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <label className="block rounded-xl border border-gray-200 p-4">
                    <span className="text-sm font-semibold text-gray-900">Tipo de acesso</span>
                    <select
                      value={share?.visibility ?? "PRIVATE"}
                      onChange={(event) => updateShare({ visibility: event.target.value as ShareVisibility })}
                      className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PRIVATE">Privado</option>
                      <option value="PUBLIC">Publico com link</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Privado exige utilizadores autorizados. Publico permite convidados sem conta.
                    </p>
                  </label>

                  <label className="block rounded-xl border border-gray-200 p-4">
                    <span className="text-sm font-semibold text-gray-900">Permissao publica</span>
                    <select
                      value={share?.publicPermission ?? "READ"}
                      onChange={(event) =>
                        updateShare({ publicPermission: event.target.value as SharePermission })
                      }
                      disabled={share?.visibility !== "PUBLIC"}
                      className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="READ">Apenas leitura</option>
                      <option value="WRITE">Pode editar</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Esta permissao afeta guests e qualquer pessoa com o link publico.
                    </p>
                  </label>
                </section>

                <section className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900">Utilizadores autorizados</p>
                    <p className="mt-1 text-xs text-gray-500">Usado quando a partilha esta em modo privado.</p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <input
                      value={participantEmail}
                      onChange={(event) => setParticipantEmail(event.target.value)}
                      placeholder="email@exemplo.com"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={participantPermission}
                      onChange={(event) => setParticipantPermission(event.target.value as SharePermission)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="READ">Leitura</option>
                      <option value="WRITE">Edicao</option>
                    </select>
                    <button
                      type="button"
                      onClick={addParticipant}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
                    >
                      <UserPlus className="h-4 w-4" />
                      Adicionar
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {share?.participants.length ? (
                      share.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {participant.utilizador.nome}
                            </p>
                            <p className="truncate text-xs text-gray-500">{participant.utilizador.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-600">
                              {participant.permission === "WRITE" ? "Edicao" : "Leitura"}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeParticipant(participant.id)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Remover acesso"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
                        Ainda nao ha utilizadores privados autorizados.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterPill({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
        active ? "bg-blue-100 text-blue-900" : "bg-gray-100 text-gray-600 hover:bg-blue-50"
      }`}
    >
      {color ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

function ApontamentosSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 lg:flex-row">
      <aside className="w-full border-b border-gray-200 bg-white p-4 lg:w-[280px] lg:border-b-0 lg:border-r">
        <div className="h-10 rounded-lg bg-gray-200" />
        <div className="mt-4 h-9 rounded-lg bg-gray-100" />
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-100" />
          <div className="h-6 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-20 rounded-lg bg-gray-100" />
          <div className="h-20 rounded-lg bg-gray-100" />
          <div className="h-20 rounded-lg bg-gray-100" />
        </div>
      </aside>
      <main className="min-h-0 flex-1 bg-white p-6 lg:p-10">
        <div className="h-10 max-w-xl rounded-lg bg-gray-100" />
        <div className="mt-4 h-9 max-w-2xl rounded-lg bg-gray-100" />
        <div className="mt-8 h-64 rounded-lg bg-gray-50" />
      </main>
    </div>
  );
}

function NoteToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const buttonClass = "rounded-md p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const activeClass = "bg-blue-100 text-blue-700";
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [isCodeBlockActive, setIsCodeBlockActive] = useState(() => editor.isActive("codeBlock"));
  const [codeLanguage, setCodeLanguage] = useState(
    () => editor.getAttributes("codeBlock").language || "plaintext",
  );

  useEffect(() => {
    const syncCodeBlockState = () => {
      const active = editor.isActive("codeBlock");
      setIsCodeBlockActive(active);
      setCodeLanguage(active ? editor.getAttributes("codeBlock").language || "plaintext" : "plaintext");
    };

    syncCodeBlockState();
    editor.on("selectionUpdate", syncCodeBlockState);
    editor.on("transaction", syncCodeBlockState);

    return () => {
      editor.off("selectionUpdate", syncCodeBlockState);
      editor.off("transaction", syncCodeBlockState);
    };
  }, [editor]);

  const copyCurrentCodeBlock = async () => {
    const text = editor.state.selection.$from.parent.textContent;
    if (!text.trim()) {
      toast.error("Este bloco de codigo esta vazio.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Codigo copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o codigo.");
    }
  };

  const insertStudyBlock = (kind: string) => {
    const block = studyBlocks.find((item) => item.kind === kind);
    if (!block) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "studyBlock",
        attrs: {
          kind: block.kind,
          title: block.title,
        },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: block.placeholder }],
          },
        ],
      })
      .run();
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const formatFileSize = (bytes: number) => `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;

  const ensureFileSize = (file: File, maxSize: number) => {
    if (file.size <= maxSize) return true;
    toast.error(`O ficheiro deve ter no máximo ${formatFileSize(maxSize)} nesta versão.`);
    return false;
  };

  const handleImageFile = async (file?: File) => {
    if (!file || !ensureFileSize(file, fileLimits.image)) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Seleciona um ficheiro de imagem.");
      return;
    }

    const src = await fileToDataUrl(file);
    editor.chain().focus().setImage({ src, alt: file.name }).run();
    toast.success("Imagem inserida.");
  };

  const detectAttachmentKind = (file: File): "audio" | "video" | null => {
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.startsWith("video/")) return "video";
    return null;
  };

  const handlePdfFile = async (file?: File) => {
    if (!file || !ensureFileSize(file, fileLimits.pdf)) return;
    if (file.type !== "application/pdf") {
      toast.error("Seleciona um ficheiro PDF.");
      return;
    }

    const href = await fileToDataUrl(file);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "attachmentBlock",
        attrs: {
          href,
          title: file.name,
          description: `${formatFileSize(file.size)} · PDF`,
          kind: "pdf",
        },
      })
      .run();
    toast.success("PDF inserido.");
  };

  const handleMediaAttachmentFile = async (file?: File) => {
    if (!file) return;
    const kind = detectAttachmentKind(file);
    if (!kind) {
      toast.error("Neste momento os anexos aceitam apenas áudio ou vídeo.");
      return;
    }

    const limit = kind === "audio" ? fileLimits.audio : fileLimits.video;
    if (!ensureFileSize(file, limit)) return;

    const href = await fileToDataUrl(file);
    editor
      .chain()
      .focus()
      .insertContent({
        type: "attachmentBlock",
        attrs: {
          href,
          title: file.name,
          description: `${formatFileSize(file.size)} · ${kind === "audio" ? "Áudio" : "Vídeo"}`,
          kind,
        },
      })
      .run();
    toast.success(kind === "audio" ? "Áudio inserido." : "Vídeo inserido.");
  };

  return (
    <div className="sticky top-0 z-10 mb-6 flex items-center gap-2 overflow-x-auto border-y border-gray-200 bg-white/95 py-2 backdrop-blur">
      <select
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : editor.isActive("blockquote")
                  ? "quote"
                  : isCodeBlockActive
                    ? "code"
                    : "paragraph"
        }
        onChange={(event) => {
          const value = event.target.value;
          if (value === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
          if (value === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
          if (value === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          if (value === "quote") editor.chain().focus().toggleBlockquote().run();
          if (value === "code") editor.chain().focus().toggleCodeBlock().run();
          if (value === "paragraph") editor.chain().focus().setParagraph().run();
        }}
        className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        title="Tipo de bloco"
      >
        <option value="paragraph">Paragrafo</option>
        <option value="h1">Titulo 1</option>
        <option value="h2">Titulo 2</option>
        <option value="h3">Titulo 3</option>
        <option value="quote">Citacao</option>
        <option value="code">Codigo</option>
      </select>

      <select
        defaultValue=""
        onChange={(event) => {
          if (!event.target.value) return;
          insertStudyBlock(event.target.value);
          event.target.value = "";
        }}
        className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        title="Inserir bloco de estudo"
      >
        <option value="">Bloco de estudo</option>
        {studyBlocks.map((block) => (
          <option key={block.kind} value={block.kind}>
            {block.label}
          </option>
        ))}
      </select>

      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <ToolbarButton title="Inserir imagem" icon={<ImageIcon className="h-4 w-4" />} active={false} onClick={() => imageInputRef.current?.click()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Inserir PDF" icon={<FileText className="h-4 w-4" />} active={false} onClick={() => pdfInputRef.current?.click()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Inserir áudio/vídeo" icon={<Paperclip className="h-4 w-4" />} active={false} onClick={() => attachmentInputRef.current?.click()} className={buttonClass} activeClass={activeClass} />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleImageFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            void handlePdfFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <input
          ref={attachmentInputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={(event) => {
            void handleMediaAttachmentFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <ToolbarButton title="Negrito" icon={<Bold className="h-4 w-4" />} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Italico" icon={<Italic className="h-4 w-4" />} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Sublinhado" icon={<UnderlineIcon className="h-4 w-4" />} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonClass} activeClass={activeClass} />
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: "#FFFBEB" }).run()} className={buttonClass} aria-label="Realcar texto" title="Realcar texto">
          <Highlighter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <ToolbarButton title="Lista" icon={<List className="h-4 w-4" />} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Lista numerada" icon={<ListOrdered className="h-4 w-4" />} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Checklist" icon={<CheckSquare className="h-4 w-4" />} active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} className={buttonClass} activeClass={activeClass} />
        <ToolbarButton title="Citacao" icon={<Quote className="h-4 w-4" />} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={buttonClass} activeClass={activeClass} />
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <ToolbarButton title="Bloco de codigo" icon={<Code2 className="h-4 w-4" />} active={isCodeBlockActive} onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={buttonClass} activeClass={activeClass} />
        <select
          value={codeLanguage}
          onChange={(event) => {
            const language = event.target.value;
            setCodeLanguage(language);
            setIsCodeBlockActive(true);
            const chain = editor.chain().focus();
            if (isCodeBlockActive) {
              chain.updateAttributes("codeBlock", { language }).run();
              return;
            }
            chain.setCodeBlock({ language }).run();
          }}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Linguagem do bloco de codigo"
          title="Linguagem do bloco de codigo"
        >
          {codeLanguages.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
        {isCodeBlockActive ? (
          <ToolbarButton title="Copiar codigo" icon={<Copy className="h-4 w-4" />} active={false} onClick={copyCurrentCodeBlock} className={buttonClass} activeClass={activeClass} />
        ) : null}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  active,
  onClick,
  className,
  activeClass,
  title,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className: string;
  activeClass: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className + " " + (active ? activeClass : "")}
      aria-label={title}
      title={title}
    >
      {icon}
    </button>
  );
}

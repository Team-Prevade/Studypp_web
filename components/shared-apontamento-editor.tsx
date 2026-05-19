"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Save, UsersRound, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

type Collaborator = {
  name: string;
  color: string;
  guest: boolean;
};

type SharedApontamentoEditorProps = {
  token: string;
  noteId: string;
  initialTitle: string;
  initialContent: string;
  permission: "READ" | "WRITE";
  collaborationToken: string;
  collaborator: Collaborator;
  ownerName: string;
};

type AwarenessUser = Collaborator & { clientId: number };

const emptyContent = "<p></p>";

export function SharedApontamentoEditor({
  token,
  noteId,
  initialTitle,
  initialContent,
  permission,
  collaborationToken,
  collaborator,
  ownerName,
}: SharedApontamentoEditorProps) {
  const canEdit = permission === "WRITE";
  const [title, setTitle] = useState(initialTitle || "Sem titulo");
  const [dirty, setDirty] = useState(false);
  const [connected, setConnected] = useState(false);
  const [providerState, setProviderState] = useState<{
    provider: HocuspocusProvider;
    doc: Y.Doc;
  } | null>(null);
  const [activeUsers, setActiveUsers] = useState<AwarenessUser[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:1234",
      name: `apontamento:${noteId}`,
      token: collaborationToken,
      document: doc,
    });
    const awareness = provider.awareness;

    awareness?.setLocalStateField("user", collaborator);

    const updateUsers = () => {
      const users = Array.from(awareness?.getStates().entries() ?? [])
        .map(([clientId, state]) => ({ clientId, ...(state.user as Collaborator) }))
        .filter((user) => user.name && user.color);
      setActiveUsers(users);
    };

    provider.on("status", ({ status }: { status: string }) => {
      setConnected(status === "connected");
    });
    awareness?.on("change", updateUsers);
    updateUsers();
    setProviderState({ provider, doc });

    return () => {
      awareness?.off("change", updateUsers);
      provider.destroy();
      doc.destroy();
    };
  }, [collaborationToken, collaborator, noteId]);

  const extensions = useMemo(() => {
    if (!providerState) return [];

    return [
      StarterKit.configure({
        undoRedo: false,
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: canEdit ? "Escreve em conjunto..." : "Modo leitura" }),
      Underline,
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Collaboration.configure({
        document: providerState.doc,
      }),
      CollaborationCaret.configure({
        provider: providerState.provider,
        user: collaborator,
      }),
    ];
  }, [canEdit, collaborator, providerState]);

  const editor = useEditor(
    {
      extensions: extensions.length ? extensions : [StarterKit],
      editable: canEdit && Boolean(providerState),
      editorProps: {
        attributes: {
          class: "studypp-shared-editor min-h-[55vh] outline-none",
        },
      },
      onCreate: ({ editor: createdEditor }) => {
        if (!initialized.current) {
          initialized.current = true;
          createdEditor.commands.setContent(initialContent || emptyContent, { emitUpdate: false });
        }
      },
      onUpdate: () => {
        setDirty(true);
      },
      immediatelyRender: false,
    },
    [providerState, extensions, canEdit, initialContent],
  );

  const save = useCallback(async (showFeedback = true) => {
    if (!editor || !canEdit) return;

    const response = await fetch(`/api/share/apontamentos/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: title,
        conteudo: editor.getHTML(),
      }),
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

    if (!response.ok || !result?.success) {
      if (showFeedback) {
        toast.error(result?.error || "Nao foi possivel guardar.");
      }
      return;
    }

    setDirty(false);
    if (showFeedback) {
      toast.success("Apontamento guardado.");
    }
  }, [canEdit, editor, title, token]);

  useEffect(() => {
    if (!dirty || !canEdit || !editor) return;

    const timeout = window.setTimeout(() => {
      void save(false);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [canEdit, dirty, editor, save, title]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-gray-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Study++ shared note</p>
            <p className="mt-1 text-sm text-gray-500">
              Partilhado por {ownerName} · {canEdit ? "edicao permitida" : "apenas leitura"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
              {connected ? <Wifi className="h-3.5 w-3.5 text-teal-700" /> : <WifiOff className="h-3.5 w-3.5 text-red-600" />}
              {connected ? "Realtime ativo" : "A ligar..."}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
              <UsersRound className="h-3.5 w-3.5" />
              {activeUsers.length} online
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => save(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <Save className="h-4 w-4" />
                {dirty ? "Guardar" : "Guardado"}
              </button>
            )}
          </div>
        </header>

        <section className="flex flex-wrap gap-2 pb-5">
          {activeUsers.map((user) => (
            <span
              key={user.clientId}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: user.color }} />
              {user.name}
              {user.guest ? " · guest" : ""}
            </span>
          ))}
        </section>

        <article className="flex-1 rounded-xl bg-white px-5 py-6 shadow-sm sm:px-10 sm:py-8">
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
            disabled={!canEdit}
            className="mb-6 w-full border-none bg-transparent text-3xl font-bold text-gray-950 outline-none placeholder:text-gray-300 disabled:text-gray-950"
            placeholder="Sem titulo"
          />
          {editor ? <EditorContent editor={editor} /> : <p className="text-sm text-gray-500">A preparar editor...</p>}
        </article>
      </div>
    </main>
  );
}

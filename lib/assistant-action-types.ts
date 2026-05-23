export type AssistantActionType =
  | "create_task"
  | "create_event"
  | "create_reminder"
  | "create_discipline";

export type AssistantActionProposal = {
  id: string;
  type: AssistantActionType;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
};

export type AssistantStructuredResponse = {
  message: string;
  actions: AssistantActionProposal[];
};

export const assistantActionLabels: Record<AssistantActionType, string> = {
  create_task: "Criar tarefa",
  create_event: "Criar evento",
  create_reminder: "Criar lembrete",
  create_discipline: "Criar disciplina",
};

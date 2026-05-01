"use client";

import { useState } from "react";
import { CheckSquare, Trash2, Plus, AlertCircle, Clock } from "lucide-react";
import { updateTaskStatusAction, deleteTaskAction } from "@/lib/tasks-actions";

interface Disciplina {
  id: string;
  nome: string;
  cor?: string;
}

interface Tarefa {
  id: string;
  descricao: string;
  prazo: string | Date;
  status: string;
  prioridade: string;
  disciplina?: Disciplina;
}

interface TaskListProps {
  tarefas: Tarefa[];
  pendentes: number;
  completas: number;
}

const statusBadges = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  CONCLUIDA: "bg-green-100 text-green-800",
  CANCELADA: "bg-gray-100 text-gray-800",
};

const priorityBadges = {
  ALTA: "bg-red-100 text-red-800 border border-red-200",
  MEDIA: "bg-orange-100 text-orange-800 border border-orange-200",
  BAIXA: "bg-blue-100 text-blue-800 border border-blue-200",
};

const priorityIcons = {
  ALTA: <AlertCircle className="w-4 h-4" />,
  MEDIA: <Clock className="w-4 h-4" />,
  BAIXA: <Clock className="w-4 h-4" />,
};

export function TaskList({ tarefas, pendentes, completas }: TaskListProps) {
  const [filter, setFilter] = useState("todas");
  const [loading, setLoading] = useState(false);

  const filteredTarefas = tarefas.filter((t) => {
    if (filter === "todas") return true;
    if (filter === "pendentes") return t.status === "PENDENTE";
    if (filter === "completas") return t.status === "CONCLUIDA";
    return true;
  });

  const handleToggleStatus = async (
    tarefaId: string,
    currentStatus: string,
  ) => {
    setLoading(true);
    const newStatus = currentStatus === "PENDENTE" ? "CONCLUIDA" : "PENDENTE";
    await updateTaskStatusAction(tarefaId, newStatus);
    setLoading(false);
    // Reload the page to get updated data
    window.location.reload();
  };

  const handleDelete = async (tarefaId: string) => {
    if (confirm("Tem a certeza que deseja eliminar esta tarefa?")) {
      setLoading(true);
      await deleteTaskAction(tarefaId);
      setLoading(false);
      // Reload the page to get updated data
      window.location.reload();
    }
  };

  const formatPrazo = (prazo: string | Date) => {
    const date = typeof prazo === "string" ? new Date(prazo) : prazo;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã";
    }

    const daysUntil = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil < 0) {
      return `Atrasado ${Math.abs(daysUntil)} dias`;
    }
    if (daysUntil === 0) {
      return "Hoje";
    }

    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm">Total de Tarefas</p>
          <p className="text-3xl font-bold text-gray-900">{tarefas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-600">
          <p className="text-gray-600 text-sm">Pendentes</p>
          <p className="text-3xl font-bold text-gray-900">{pendentes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm">Completas</p>
          <p className="text-3xl font-bold text-gray-900">{completas}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["todas", "pendentes", "completas"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300"
            }`}
          >
            {f === "todas" && "Todas"}
            {f === "pendentes" && "Pendentes"}
            {f === "completas" && "Completas"}
          </button>
        ))}
      </div>

      {/* Add task button */}
      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        <Plus className="w-4 h-4" />
        Nova Tarefa
      </button>

      {/* Task list */}
      {filteredTarefas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">
            Nenhuma tarefa {filter !== "todas" ? `${filter}` : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTarefas.map((tarefa) => (
            <div
              key={tarefa.id}
              className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
                tarefa.status === "CONCLUIDA" ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleStatus(tarefa.id, tarefa.status)}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    tarefa.status === "CONCLUIDA"
                      ? "bg-green-600 border-green-600"
                      : "border-gray-300 hover:border-blue-600"
                  }`}
                  disabled={loading}
                >
                  {tarefa.status === "CONCLUIDA" && (
                    <CheckSquare className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          tarefa.status === "CONCLUIDA"
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {tarefa.descricao}
                      </h3>
                      {tarefa.disciplina && (
                        <p className="text-sm text-gray-600 mt-1">
                          {tarefa.disciplina.nome}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(tarefa.id)}
                      className="p-2 hover:bg-red-50 rounded transition-colors text-gray-400 hover:text-red-600"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        statusBadges[
                          tarefa.status as keyof typeof statusBadges
                        ] || statusBadges.PENDENTE
                      }`}
                    >
                      {tarefa.status === "PENDENTE" && "Pendente"}
                      {tarefa.status === "CONCLUIDA" && "Concluída"}
                      {tarefa.status === "CANCELADA" && "Cancelada"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        priorityBadges[
                          tarefa.prioridade as keyof typeof priorityBadges
                        ] || priorityBadges.BAIXA
                      }`}
                    >
                      {priorityIcons[
                        tarefa.prioridade as keyof typeof priorityIcons
                      ] || null}
                      {tarefa.prioridade === "ALTA" && "Alta"}
                      {tarefa.prioridade === "MEDIA" && "Média"}
                      {tarefa.prioridade === "BAIXA" && "Baixa"}
                    </span>

                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatPrazo(tarefa.prazo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

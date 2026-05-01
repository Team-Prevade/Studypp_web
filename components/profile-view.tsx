"use client";

import { useState } from "react";
import { User, Mail, Lock, BookOpen, CheckCircle, Clock } from "lucide-react";
import { updateProfileAction, changePasswordAction } from "@/lib/profile-actions";

interface UserData {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  onboardingFeito: boolean;
  _count?: {
    aulas: number;
    tarefas: number;
    notas: number;
    disciplinas: number;
  };
}

interface ProfileViewProps {
  user: UserData;
}

export function ProfileView({ user }: ProfileViewProps) {
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: user.nome,
    email: user.email,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await updateProfileAction(formData.nome, formData.email);
    if (result.success) {
      setMessage("Perfil atualizado com sucesso!");
      setEditMode(false);
      // Reload to get updated data
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setMessage(result.error || "Erro ao atualizar perfil");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await changePasswordAction(
      passwordData.currentPassword,
      passwordData.newPassword,
      passwordData.confirmPassword
    );
    if (result.success) {
      setMessage("Senha alterada com sucesso!");
      setPasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setMessage(result.error || "Erro ao alterar senha");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800"></div>
        <div className="px-6 pb-6 -mt-16 relative">
          <div className="flex items-end gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg border-4 border-white">
              <User className="w-16 h-16" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.nome}</h1>
              <p className="text-gray-600">{user.email}</p>
              {user.onboardingFeito && (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Onboarding concluído</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-gray-600 text-sm">Disciplinas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {user._count?.disciplinas || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-gray-600 text-sm">Aulas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {user._count?.aulas || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-600 text-sm">Tarefas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {user._count?.tarefas || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-orange-600" />
            <span className="text-gray-600 text-sm">Notas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {user._count?.notas || 0}
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("sucesso")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Edit Profile */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Informações Pessoais</h2>
          {!editMode && !passwordMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setFormData({ nome: user.nome, email: user.email });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nome
              </label>
              <p className="text-lg text-gray-900">{user.nome}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Segurança</h2>
          {!editMode && !passwordMode && (
            <button
              onClick={() => setPasswordMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Alterar Senha
            </button>
          )}
        </div>

        {passwordMode ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Senha Atual
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Alterar Senha"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordMode(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-600">
            Clique em "Alterar Senha" para atualizar sua senha
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ArrowRight } from "lucide-react";
import { updatePerfilAction } from "@/lib/onboarding-actions";

export default function PerfilStep() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter menos de 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem");
      return;
    }

    setAvatar(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setError("Por favor, insira o seu nome");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let avatarPath: string | undefined;

      // Upload avatar if provided
      if (avatar) {
        const formData = new FormData();
        formData.append("file", avatar);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Erro ao fazer upload da imagem");
        }

        const { path } = await uploadRes.json();
        avatarPath = path;
      }

      // Update perfil
      const result = await updatePerfilAction(nome, avatarPath);

      if (!result.success) {
        setError(result.error || "Erro ao atualizar perfil");
        return;
      }

      // Redirect to next step
      router.push("/onboarding/disciplinas");
    } catch (err) {
      console.error("Error:", err);
      setError("Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Como te chamas?</h1>
        <p className="text-gray-600">Vamos personalizar a tua experiência.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 max-w-2xl">
        {/* Avatar Upload */}
        <div className="mb-10">
          <label className="block text-sm font-semibold text-gray-900 mb-4">
            Foto de Perfil
          </label>
          <div className="flex items-start gap-6">
            {/* Avatar Preview */}
            <div>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-2 border-dashed border-blue-300">
                  <span className="text-3xl">👤</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1">
              <label
                htmlFor="avatar-input"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Carregar foto</span>
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                JPG, GIF ou PNG. Máximo de 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-8">
          <label htmlFor="nome" className="block text-sm font-semibold text-gray-900 mb-2">
            O teu nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setError("");
            }}
            placeholder="Ex: Maria Santos"
            className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={loading || !nome.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

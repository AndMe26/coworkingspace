"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ShieldAlert,
  FolderTree,
  Building,
  Ban,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"moderation" | "categories">("moderation");
  const [spaces, setSpaces] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Moderación (Cancelar espacio con motivo obligatorio)
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Nueva Categoría
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spacesRes, catsRes] = await Promise.all([
        fetch("/api/spaces"),
        fetch("/api/categories"),
      ]);

      if (spacesRes.ok) {
        const sData = await spacesRes.json();
        setSpaces(sData.spaces || []);
      }
      if (catsRes.ok) {
        const cData = await catsRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error("Error al cargar datos de admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cancelar espacio por moderación (Regla 14)
  const handleCancelSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) return;

    setCancelLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/spaces/${selectedSpace.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Error al cancelar el espacio");
        setCancelLoading(false);
        return;
      }

      setActionSuccess("Espacio cancelado por moderación correctamente.");
      setSelectedSpace(null);
      setCancelReason("");
      fetchData();
    } catch {
      setActionError("Error de comunicación con el servidor");
    } finally {
      setCancelLoading(false);
    }
  };

  // Crear Categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatLoading(true);
    setActionError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, description: newCatDesc }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Error al crear categoría");
        setCatLoading(false);
        return;
      }

      setNewCatName("");
      setNewCatDesc("");
      fetchData();
    } catch {
      setActionError("Error de conexión");
    } finally {
      setCatLoading(false);
    }
  };

  // Eliminar Categoría (Regla 16: falla si tiene espacios)
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "No se puede eliminar la categoría");
        return;
      }

      setActionSuccess("Categoría eliminada exitosamente.");
      fetchData();
    } catch {
      setActionError("Error al procesar la solicitud");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-neutral-800">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {t.admin.title}
          </h1>
          <p className="text-xs text-neutral-400">
            Control de moderación de espacios y catálogo de categorías de coworking
          </p>
        </div>
      </div>

      {actionError && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("moderation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "moderation"
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{t.admin.tabModeration} ({spaces.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "categories"
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{t.admin.tabCategories} ({categories.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Cargando datos administrativos...</span>
          </div>
        ) : activeTab === "moderation" ? (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-neutral-400 mb-2">
              Como administrador puedes suspender o cancelar un espacio por causas de fuerza mayor o infracción registrando el motivo correspondiente.
            </div>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="px-5 py-3.5">Título / Espacio</th>
                    <th className="px-5 py-3.5">Categoría</th>
                    <th className="px-5 py-3.5">Anfitrión</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {spaces.map((sp) => (
                    <tr key={sp.id} className="hover:bg-neutral-800/30">
                      <td className="px-5 py-4 font-semibold text-white">
                        {sp.title}
                        {sp.cancelReason && (
                          <span className="block text-[11px] text-rose-400 font-normal mt-0.5">
                            {sp.cancelReason}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">{sp.category?.name}</td>
                      <td className="px-5 py-4 font-mono">{sp.host?.name}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            sp.computedStatus === "AVAILABLE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : sp.computedStatus === "RESERVED"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : sp.computedStatus === "CANCELLED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-neutral-800 text-neutral-400 border-neutral-700"
                          }`}
                        >
                          {sp.computedStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {sp.computedStatus !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => setSelectedSpace(sp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Moderar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Categorías */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white mb-2">Categorías Registradas</h3>
              <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="px-5 py-3.5">Nombre</th>
                      <th className="px-5 py-3.5">Slug</th>
                      <th className="px-5 py-3.5">Espacios Asociados</th>
                      <th className="px-5 py-3.5 text-right">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-neutral-800/30">
                        <td className="px-5 py-4 font-semibold text-white">{cat.name}</td>
                        <td className="px-5 py-4 font-mono text-neutral-400">{cat.slug}</td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-emerald-400">
                            {cat._count?.spaces || 0}
                          </span>{" "}
                          espacios
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
                            title="Eliminar categoría (solo si no tiene espacios)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Crear Nueva Categoría */}
            <div className="lg:col-span-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Nueva Categoría</span>
              </h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej: Sala de Realidad Virtual"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Espacios diseñados para pruebas de VR y diseño 3D"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={catLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {catLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Crear Categoría</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cancelación Administrativa con Motivo Obligatorio (Regla 14) */}
      {selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>{t.admin.cancelModalTitle}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Espacio: <span className="font-semibold text-white">{selectedSpace.title}</span>
            </p>

            <form onSubmit={handleCancelSpace} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {t.admin.cancelReasonLabel} (mín. 10 caracteres) *
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t.admin.cancelReasonPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpace(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t.admin.confirmCancelBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

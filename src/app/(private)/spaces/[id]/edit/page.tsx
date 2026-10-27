"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Building2 } from "lucide-react";

export default function EditSpacePage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [price, setPrice] = useState("600");
  const [serviceFee, setServiceFee] = useState("60");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadSpace() {
      try {
        const [spaceRes, catRes] = await Promise.all([
          fetch(`/api/spaces/${spaceId}`),
          fetch("/api/categories"),
        ]);

        const sData = await spaceRes.json();
        const cData = await catRes.json();

        if (!spaceRes.ok) {
          setError(sData.error || "No se pudo cargar el espacio");
          return;
        }

        const sp = sData.space;
        if (sp.reservation || sp.computedStatus !== "AVAILABLE") {
          setError("Este espacio no puede ser editado: cuenta con reserva o ya no está disponible.");
          return;
        }

        setTitle(sp.title);
        setDescription(sp.description);
        setAddress(sp.address);
        setCapacity(String(sp.capacity));
        setPrice(String(sp.price));
        setServiceFee(String(sp.serviceFee));
        setImageUrl(sp.imageUrl);
        setCategoryId(sp.categoryId);
        setCategories(cData.categories || []);
      } catch {
        setError("Error al cargar datos del espacio");
      } finally {
        setLoading(false);
      }
    }

    if (spaceId) loadSpace();
  }, [spaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          address,
          capacity: Number(capacity),
          price: Number(price),
          serviceFee: Number(serviceFee),
          imageUrl,
          categoryId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al actualizar el espacio");
        setSaving(false);
        return;
      }

      router.push(`/spaces/${spaceId}`);
    } catch {
      setError("Error de red al guardar los cambios");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span>Cargando datos del espacio...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Mi Panel</span>
      </Link>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white">Editar Espacio</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Modifica la información de tu espacio publicado (solo permitido mientras no tenga reservas).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Título del Espacio *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Descripción *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Capacidad (personas) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Categoría *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Precio Base ($ COP) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Tarifa de Servicio ($ COP) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              URL de la Imagen *
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Actualizar Espacio</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

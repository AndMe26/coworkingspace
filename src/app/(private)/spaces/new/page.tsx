"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Building2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NewSpacePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("600");
  const [serviceFee, setServiceFee] = useState("60");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80");
  const [hoursOption, setHoursOption] = useState("72"); // 3 días por defecto

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok && data.categories?.length > 0) {
          setCategories(data.categories);
          setCategoryId(data.categories[0].id);
        }
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Calcular expiresAt según las horas elegidas (1h a 7 días - Regla 2)
    const hours = Number(hoursOption);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          address,
          capacity: Number(capacity),
          categoryId,
          price: Number(price),
          serviceFee: Number(serviceFee),
          imageUrl,
          expiresAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No fue posible publicar el espacio");
        setLoading(false);
        return;
      }

      router.push(`/spaces/${data.space.id}`);
    } catch {
      setError("Error de conexión al enviar el formulario");
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-extrabold text-white">
            {t.publish.title}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {t.publish.subtitle} (Recuerda que tienes un máximo de 5 espacios activos permitidos)
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
              {t.publish.fieldTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Sala de Juntas Corporativa Reforma 222"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.publish.fieldDescription} *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe amenidades, equipamiento, vistas, café incluido, etc."
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.publish.fieldAddress} *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Paseo de la Reforma 222, Piso 14"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.publish.fieldCapacity} *
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
                {t.publish.fieldCategory} *
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
                {t.publish.fieldPrice} (&gt; 0) *
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
                {t.publish.fieldServiceFee} (&gt; 0) *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.publish.fieldImageUrl} *
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.publish.fieldHours} *
              </label>
              <select
                value={hoursOption}
                onChange={(e) => setHoursOption(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="12">{t.publish.hoursOption1}</option>
                <option value="24">{t.publish.hoursOption2}</option>
                <option value="72">{t.publish.hoursOption3}</option>
                <option value="168">{t.publish.hoursOption4}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publicando espacio...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>{t.publish.submitBtn}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

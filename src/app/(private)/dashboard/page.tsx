"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SpaceCard } from "@/components/spaces/SpaceCard";
import {
  Building2,
  CalendarCheck,
  PlusCircle,
  Clock,
  CheckCircle,
  Ban,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"spaces" | "reservations">("spaces");
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        // Cargar mis espacios publicados
        const spacesRes = await fetch(`/api/spaces?hostId=${user.id}`);
        if (spacesRes.ok) {
          const sData = await spacesRes.json();
          setMySpaces(sData.spaces || []);
        }

        // Cargar mis reservas realizadas
        const reservationsRes = await fetch("/api/reservations");
        if (reservationsRes.ok) {
          const rData = await reservationsRes.json();
          setMyReservations(rData.reservations || []);
        }
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Contar espacios activos simultáneos (Regla 4: máx 5)
  const activeSpacesCount = mySpaces.filter((s) => s.computedStatus === "AVAILABLE").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.dashboard.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Bienvenido, <span className="text-emerald-400 font-semibold">{user?.name}</span>. {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/spaces/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-md shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.dashboard.newSpaceBtn}</span>
          </Link>
        </div>
      </div>

      {/* Alerta de Límite de Espacios Activos (Regla 4) */}
      <div className="mt-6 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white block">
              Límite de Publicaciones Simultáneas
            </span>
            <span className="text-neutral-400">
              Tienes <span className="text-emerald-400 font-bold">{activeSpacesCount}</span> de{" "}
              <span className="font-bold text-white">5</span> espacios activos publicados actualmente.
            </span>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
            activeSpacesCount >= 5
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {activeSpacesCount}/5 Activos
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("spaces")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "spaces"
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.dashboard.tabMySpaces} ({mySpaces.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reservations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "reservations"
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>{t.dashboard.tabMyReservations} ({myReservations.length})</span>
        </button>
      </div>

      {/* Contenido de Tabs */}
      <div className="mt-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Cargando tu información...</span>
          </div>
        ) : activeTab === "spaces" ? (
          mySpaces.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-xs">
              <p>{t.dashboard.noSpaces}</p>
              <Link
                href="/spaces/new"
                className="mt-4 inline-flex items-center gap-1.5 text-emerald-400 font-bold hover:underline"
              >
                <span>{t.dashboard.newSpaceBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySpaces.map((space) => (
                <div key={space.id} className="relative flex flex-col">
                  <SpaceCard space={space} />
                  {/* Botón de edición o cancelación para el anfitrión (Regla 5 y 13) */}
                  <div className="mt-2 flex gap-2">
                    {space.computedStatus === "AVAILABLE" && !space.reservation && (
                      <Link
                        href={`/spaces/${space.id}/edit`}
                        className="flex-1 text-center py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : myReservations.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-xs">
            <p>{t.dashboard.noReservations}</p>
            <Link
              href="/spaces"
              className="mt-4 inline-flex items-center gap-1.5 text-emerald-400 font-bold hover:underline"
            >
              <span>Explorar espacios para reservar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myReservations.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {res.space.title}
                    </h4>
                    <span className="text-xs text-neutral-400 block mt-0.5">
                      Categoría: {res.space.category.name} | Anfitrión: {res.space.host.name}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1 block">
                      {t.dashboard.reservedAt}: {new Date(res.reservedAt).toLocaleString("es-MX")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 uppercase block">Total Pagado</span>
                    <span className="font-extrabold text-sm text-emerald-400 font-mono">
                      ${Number(res.totalAmount).toLocaleString("es-CO")} COP
                    </span>
                  </div>

                  <Link
                    href={`/spaces/${res.spaceId}`}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
                  >
                    Ver Espacio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

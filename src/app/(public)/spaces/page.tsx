import { prisma } from "@/lib/prisma";
import { resolveSpaceStatus } from "@/lib/space-status";
import { SpaceCard } from "@/components/spaces/SpaceCard";
import Link from "next/link";
import { Filter, Layers } from "lucide-react";

// SSR Dinámico: Renderizado en servidor bajo demanda con los filtros más actualizados
export const dynamic = "force-dynamic";

interface SpacesPageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    q?: string;
  }>;
}

export default async function SpacesPage({ searchParams }: SpacesPageProps) {
  const { category, status, q } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const where: any = {};
  if (category && category !== "all") {
    where.category = { slug: category };
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  const rawSpaces = await prisma.space.findMany({
    where,
    include: {
      category: true,
      host: { select: { name: true } },
      reservation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  // Calcular en tiempo real estado (AVAILABLE -> EXPIRED si expiró)
  const computedSpaces = rawSpaces.map((s) => ({
    ...s,
    price: Number(s.price),
    serviceFee: Number(s.serviceFee),
    reservation: s.reservation
      ? {
          ...s.reservation,
          totalAmount: Number(s.reservation.totalAmount),
        }
      : null,
    computedStatus: resolveSpaceStatus(s, now),
  }));

  const filteredSpaces = status && status !== "all"
    ? computedSpaces.filter((s) => s.computedStatus === status)
    : computedSpaces;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Encabezado */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Catálogo de Espacios de Coworking
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Explora salas de reuniones, oficinas privadas y puestos flexibles con reserva exclusiva.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="mb-10 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-wrap items-center gap-4">
        {/* Filtro por Categoría */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-neutral-300">Categoría:</span>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href="/spaces"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !category || category === "all"
                  ? "bg-emerald-500 text-neutral-950 font-bold"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              Todas
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/spaces?category=${c.slug}${status ? `&status=${status}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === c.slug
                    ? "bg-emerald-500 text-neutral-950 font-bold"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-300">Estado:</span>
          <div className="flex gap-1.5">
            {[
              { id: "all", label: "Todos" },
              { id: "AVAILABLE", label: "Disponibles" },
              { id: "RESERVED", label: "Reservados" },
              { id: "EXPIRED", label: "Expirados" },
            ].map((st) => (
              <Link
                key={st.id}
                href={`/spaces?status=${st.id}${category ? `&category=${category}` : ""}`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  (status === st.id) || (!status && st.id === "all")
                    ? "bg-neutral-200 text-neutral-900 font-bold"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                {st.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Espacios */}
      {filteredSpaces.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-800 text-neutral-500 text-sm">
          No se encontraron espacios con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard key={space.id} space={space as any} />
          ))}
        </div>
      )}
    </div>
  );
}

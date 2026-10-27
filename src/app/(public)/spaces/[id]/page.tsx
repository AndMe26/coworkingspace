import { prisma } from "@/lib/prisma";
import { resolveSpaceStatus, maskEmailOrName } from "@/lib/space-status";
import { ReserveButton } from "@/components/spaces/ReserveButton";
import { CountdownTimer } from "@/components/spaces/CountdownTimer";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Users,
  ShieldCheck,
  Calendar,
  Lock,
  Tag,
  Clock,
  User,
} from "lucide-react";

// SSR Dinámico: Consulta siempre el estado más reciente del espacio
export const dynamic = "force-dynamic";

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { id } = await params;

  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      category: true,
      host: { select: { id: true, name: true } },
      reservation: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!space) {
    notFound();
  }

  const now = new Date();
  const computedStatus = resolveSpaceStatus(space, now);

  const price = Number(space.price);
  const serviceFee = Number(space.serviceFee);
  const total = price + serviceFee;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Botón de regreso */}
      <Link
        href="/spaces"
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al Catálogo de Espacios</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Columna Izquierda / Central: Foto, Titulo, Descripción y Metadatos */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Imagen Principal */}
          <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800">
            <Image
              src={space.imageUrl}
              alt={space.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                <Tag className="w-3.5 h-3.5" />
                {space.category.name}
              </span>
            </div>
          </div>

          {/* Título y Ubicación */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {space.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{space.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>Capacidad: {space.capacity} personas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>Anfitrión: {space.host.name}</span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="border-t border-neutral-900 pt-6">
            <h2 className="text-base font-bold text-white mb-3">Descripción del Espacio</h2>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {space.description}
            </p>
          </div>

          {/* Motivo de Cancelación si aplica (Regla 14) */}
          {space.status === "CANCELLED" && space.cancelReason && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <span className="font-bold block mb-1">Motivo de Cancelación:</span>
              <span>{space.cancelReason}</span>
            </div>
          )}

          {/* Historial Público de Reserva con Identidad Enmascarada (Regla 17) */}
          {space.reservation && (
            <div className="border-t border-neutral-900 pt-6">
              <h2 className="text-base font-bold text-white mb-3">Historial de Reserva</h2>
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">
                      Reservado Exclusivamente
                    </span>
                    <span className="text-neutral-400">
                      Por:{" "}
                      <span className="text-amber-400 font-mono">
                        {maskEmailOrName(
                          space.reservation.user.name,
                          space.reservation.user.email
                        )}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="text-right text-neutral-400">
                  <span className="block">Fecha de confirmación:</span>
                  <span className="font-mono text-neutral-200">
                    {new Date(space.reservation.reservedAt).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Tarjeta Flotante de Reserva y Tarifas */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-xl flex flex-col gap-6 shadow-2xl shadow-black/60">
            {/* Encabezado de Precio */}
            <div>
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold block mb-1">
                Inversión Total
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white">
                  ${total.toLocaleString("es-CO")}
                </span>
                <span className="text-xs text-neutral-400 font-medium">COP</span>
              </div>
            </div>

            {/* Desglose de Tarifas (Regla 1) */}
            <div className="border-y border-neutral-800/80 py-4 flex flex-col gap-2.5 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Tarifa base por sesión</span>
                <span className="font-mono">${price.toLocaleString("es-CO")} COP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cuota de servicio & amenidades</span>
                <span className="font-mono">${serviceFee.toLocaleString("es-CO")} COP</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-800 text-white font-bold">
                <span>Total a Pagar</span>
                <span className="font-mono text-emerald-400">
                  ${total.toLocaleString("es-CO")} COP
                </span>
              </div>
            </div>

            {/* Temporizador de Ventana Límite (Regla 10) */}
            <div>
              <span className="text-xs font-semibold text-neutral-400 block mb-2">
                Tiempo límite de disponibilidad:
              </span>
              <CountdownTimer expiresAt={space.expiresAt} />
            </div>

            {/* Botón Atómico de Reserva (Regla 8: Bloqueo exclusivo) */}
            <ReserveButton
              spaceId={space.id}
              hostId={space.hostId}
              price={price}
              serviceFee={serviceFee}
              computedStatus={computedStatus}
              hasReservation={Boolean(space.reservation)}
            />

            {/* Garantía de Seguridad */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Garantía de bloqueo único e inmediato</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

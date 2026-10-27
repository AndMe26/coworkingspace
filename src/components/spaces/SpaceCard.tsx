"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, MapPin, Tag } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { useLanguage } from "@/context/LanguageContext";

interface SpaceCardProps {
  space: {
    id: string;
    title: string;
    description: string;
    address: string;
    capacity: number;
    price: number | string;
    serviceFee: number | string;
    imageUrl: string;
    expiresAt: string | Date;
    computedStatus: "AVAILABLE" | "RESERVED" | "EXPIRED" | "CANCELLED";
    category?: { name: string; slug: string };
    host?: { name: string };
  };
}

export function SpaceCard({ space }: SpaceCardProps) {
  const { t } = useLanguage();

  const statusConfig = {
    AVAILABLE: {
      label: t.spaces.available,
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    RESERVED: {
      label: t.spaces.reserved,
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    EXPIRED: {
      label: t.spaces.expired,
      bg: "bg-neutral-800 text-neutral-400 border-neutral-700",
    },
    CANCELLED: {
      label: t.spaces.cancelled,
      bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
  }[space.computedStatus] || {
    label: space.computedStatus,
    bg: "bg-neutral-800 text-neutral-300 border-neutral-700",
  };

  const totalPrice = Number(space.price) + Number(space.serviceFee);

  return (
    <div className="group relative flex flex-col rounded-2xl bg-neutral-900/60 border border-neutral-800/80 overflow-hidden hover:border-neutral-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/50">
      {/* Imagen del Espacio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-800">
        <Image
          src={space.imageUrl}
          alt={space.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/20" />

        {/* Badge de Estado Oficial */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${statusConfig.bg}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Categoría */}
        {space.category && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-950/70 text-neutral-200 border border-neutral-800 backdrop-blur-md">
              <Tag className="w-3 h-3 text-emerald-400" />
              {space.category.name}
            </span>
          </div>
        )}

        {/* Temporizador solo si sigue disponible */}
        {space.computedStatus === "AVAILABLE" && (
          <div className="absolute bottom-3 left-3 right-3 flex justify-end">
            <CountdownTimer expiresAt={space.expiresAt} />
          </div>
        )}
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
          {space.title}
        </h3>

        <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {space.description}
        </p>

        {/* Metadatos (Ubicación y Capacidad) */}
        <div className="mt-4 flex flex-col gap-1.5 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{space.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span>
              {space.capacity} {t.spaces.people}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-neutral-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">
              {t.spaces.total}
            </span>
            <span className="text-lg font-extrabold text-white">
              ${totalPrice.toLocaleString("es-CO")}{" "}
              <span className="text-xs font-normal text-neutral-400">COP</span>
            </span>
          </div>

          <Link
            href={`/spaces/${space.id}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-colors shadow-sm"
          >
            {t.spaces.viewDetails}
          </Link>
        </div>
      </div>
    </div>
  );
}

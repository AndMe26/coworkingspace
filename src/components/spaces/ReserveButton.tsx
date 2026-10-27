"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ReserveButtonProps {
  spaceId: string;
  hostId: string;
  price: number;
  serviceFee: number;
  computedStatus: string;
  hasReservation: boolean;
}

export function ReserveButton({
  spaceId,
  hostId,
  price,
  serviceFee,
  computedStatus,
  hasReservation,
}: ReserveButtonProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isHost = user?.id === hostId;
  const isAvailable = computedStatus === "AVAILABLE" && !hasReservation;
  const total = Number(price) + Number(serviceFee);

  const handleReserve = async () => {
    if (!user) {
      router.push(`/login?from=/spaces/${spaceId}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // HTTP 409 Conflict: Alguien más confirmó antes o ya no está disponible
        setError(data.error || "No fue posible completar la reserva");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Error de red al procesar la reserva. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-white">¡Reserva Confirmada con Éxito!</h4>
          <p className="text-xs text-neutral-300 mt-0.5">
            Este espacio ha sido bloqueado exclusivamente para ti.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300 leading-relaxed font-medium">
            {error}
          </div>
        </div>
      )}

      {isHost ? (
        <div className="w-full text-center py-3 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-amber-400 font-medium">
          {t.spaces.cannotReserveOwn}
        </div>
      ) : !isAvailable ? (
        <div className="w-full text-center py-3 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-500 font-medium flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          {t.spaces.alreadyReserved}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleReserve}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando y bloqueando espacio...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                {t.spaces.reserveNow} (${total.toLocaleString("es-CO")} COP)
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

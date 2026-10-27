"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    setMounted(true);

    const calculate = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  // Prevención garantizada de errores de hidratación entre SSR y CSR
  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-900/60 px-2.5 py-1.5 rounded-md border border-neutral-800">
        <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>Sincronizando reloj...</span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 px-2.5 py-1.5 rounded-md border border-rose-800/40">
        <Clock className="w-3.5 h-3.5 text-rose-400" />
        <span>Ventana de reserva expirada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-neutral-800 font-mono text-xs">
      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
      <div className="flex items-center gap-1 text-neutral-200">
        {timeLeft.days > 0 && (
          <>
            <span className="font-bold text-emerald-400">{timeLeft.days}d</span>
            <span className="text-neutral-500">:</span>
          </>
        )}
        <span className="font-bold text-white">
          {String(timeLeft.hours).padStart(2, "0")}h
        </span>
        <span className="text-neutral-500">:</span>
        <span className="font-bold text-white">
          {String(timeLeft.minutes).padStart(2, "0")}m
        </span>
        <span className="text-neutral-500">:</span>
        <span className="font-bold text-emerald-400">
          {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight, Building, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { SpaceCard } from "@/components/spaces/SpaceCard";

interface HomeClientProps {
  spaces: any[];
}

export function HomeClient({ spaces }: HomeClientProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28 border-b border-neutral-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
            {t.hero.title}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/spaces"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-all shadow-xl shadow-emerald-500/20"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/spaces/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-semibold text-sm transition-colors"
            >
              <span>{t.hero.ctaSecondary}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Pillars / Value Props */}
      <section className="py-16 border-b border-neutral-900 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{t.features.f1_title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.features.f1_desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{t.features.f2_title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.features.f2_desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">{t.features.f3_title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.features.f3_desc}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Spaces Gallery */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              {t.spaces.title}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {t.spaces.title}
            </h2>
          </div>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>{t.spaces.allStatuses}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {spaces.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800 text-neutral-400 text-sm">
            {t.spaces.alreadyReserved}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space as any} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

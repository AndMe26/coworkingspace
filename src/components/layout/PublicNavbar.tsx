"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Building2, Globe, LogOut, ShieldAlert, User, PlusCircle, Compass } from "lucide-react";

export function PublicNavbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              PlanCity <span className="text-emerald-400 text-sm font-semibold">Coworking</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/spaces"
            className="flex items-center gap-2 text-sm font-medium text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            <Compass className="w-4 h-4" />
            {t.nav.explore}
          </Link>
          <Link
            href="/spaces/new"
            className="flex items-center gap-2 text-sm font-medium text-neutral-300 hover:text-emerald-400 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            {t.nav.publish}
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {t.nav.admin}
            </Link>
          )}
        </nav>

        {/* Right Section: Language Switcher + User Controls */}
        <div className="flex items-center gap-3">
          {/* Selector de Idioma ES / EN */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang("es")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                lang === "es"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                lang === "en"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          {/* Estado de Autenticación */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 px-3 py-2 rounded-lg border border-neutral-800 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user.name.split(" ")[0]}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="p-2 text-neutral-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-neutral-900"
                title={t.nav.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-3.5 py-2 rounded-lg transition-all shadow-md shadow-emerald-500/20"
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 py-10 mt-20 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">PlanCity Coworking</span>
          <span>&copy; {new Date().getFullYear()} — Plataforma de reservas exclusivas.</span>
        </div>
        <div className="flex gap-6 text-neutral-500">
          <span>Reserva Segura</span>
          <span>Términos y Privacidad</span>
          <span>Soporte 24/7</span>
        </div>
      </div>
    </footer>
  );
}

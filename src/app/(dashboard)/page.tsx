"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CirclePlus,
  Crown,
  RefreshCw,
  LoaderCircle,
  Trophy,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  format: string;
  status: string;
  is_premium: boolean;
};

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("No hay una sesión administrativa activa.");
      }

      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name, format, status, is_premium")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTournaments((data ?? []) as Tournament[]);
    } catch (error) {
      console.error("Error al cargar los torneos:", error);
      setLoadError("No se pudieron cargar tus torneos. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initializeDashboard() {
      await loadTournaments();
    }

    void initializeDashboard();
  }, [loadTournaments]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-[#39ff14]/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-[#39ff14]">
            <span className="size-2 rounded-full bg-[#39ff14] shadow-[0_0_12px_#39ff14]" />
            Centro de control
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Mis Torneos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Crea, administra y comparte la experiencia completa de tus
            competencias.
          </p>
        </div>

        <Link
          href="/crear"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <CirclePlus className="size-5" aria-hidden="true" />
          Crear Torneo
        </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="flex min-h-[420px] items-center justify-center">
          <LoaderCircle
            className="size-7 animate-spin text-[#39ff14]"
            aria-label="Cargando torneos"
          />
        </div>
      ) : loadError ? (
        <section className="mt-10 flex min-h-[440px] items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-16">
          <div className="max-w-md text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
              <RefreshCw className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-white">
              No pudimos cargar tus torneos
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadTournaments()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </section>
      ) : tournaments.length === 0 ? (
        <section
          aria-labelledby="empty-state-title"
          className="mt-10 flex min-h-[440px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16"
        >
          <div className="max-w-md text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-[#39ff14]/30 bg-[#39ff14]/10 text-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.08)]">
              <Trophy className="size-9" aria-hidden="true" />
            </div>
            <h2
              id="empty-state-title"
              className="mt-6 text-xl font-semibold text-white"
            >
              Tu próximo torneo empieza acá
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Crea tu primer torneo y genera un fixture completo en segundos.
            </p>
            <Link
              href="/crear"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#39ff14] transition-colors hover:text-[#6aff4d]"
            >
              Crear mi primer torneo
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Torneos creados", value: tournaments.length, icon: Trophy },
              { label: "En curso", value: tournaments.filter((item) => item.status !== "finalizado").length, icon: CalendarDays },
              { label: "Premium", value: tournaments.filter((item) => item.is_premium).length, icon: Crown },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                  <Icon className="size-4 text-[#39ff14]" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Torneos recientes
            </h2>
            <span className="text-sm text-zinc-500">
              {tournaments.length} {tournaments.length === 1 ? "torneo" : "torneos"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/dashboard/torneo/${tournament.id}`}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-800 text-[#39ff14]">
                    <Trophy className="size-5" aria-hidden="true" />
                  </div>
                  {tournament.is_premium ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#39ff14]/30 bg-[#39ff14]/10 px-2.5 py-1 text-xs font-medium text-[#39ff14]">
                      <Crown className="size-3.5" aria-hidden="true" />
                      Premium
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-5 truncate text-lg font-semibold text-white">
                  {tournament.name}
                </h3>
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    {tournament.format}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden="true" />
                    {tournament.status}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm">
                  <span className="text-zinc-500">Administrar torneo</span>
                  <ArrowUpRight
                    className="size-4 text-zinc-600 transition-colors group-hover:text-[#39ff14]"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

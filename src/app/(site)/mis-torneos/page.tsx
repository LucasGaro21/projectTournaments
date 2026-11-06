import { ArrowUpRight, Crown, LogOut, Plus, Smartphone, UserRound, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SportArt from "@/components/brand/SportArt";
import { listMyTournaments } from "@/lib/data/manage";
import { FORMAT_LABELS, STATUS_LABELS } from "@/lib/tournament/types";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: "Mis torneos",
  robots: { index: false },
};

export default function MyTournamentsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Mis torneos</h1>
          <p className="mt-2 text-slate-600">
            Los torneos que creaste en este dispositivo y los vinculados a tu cuenta.
          </p>
        </div>
        <Link
          href="/crear"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nuevo torneo
        </Link>
      </div>
      <Suspense fallback={<div className="mt-10 h-64 animate-pulse rounded-3xl bg-slate-200/60" />}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  const { tournaments, user } = await listMyTournaments();

  return (
    <>
      <section className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {user ? (
          <>
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <UserRound className="size-4 text-brand" aria-hidden="true" />
              Ingresaste como <b>{user.email}</b>
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Smartphone className="size-4 text-slate-400" aria-hidden="true" />
              Sin cuenta: tus torneos quedan guardados en este dispositivo.
            </p>
            <Link href="/login?next=/mis-torneos" className="text-sm font-semibold text-brand hover:text-brand-hover">
              Ingresar o crear cuenta (opcional) →
            </Link>
          </>
        )}
      </section>

      {tournaments.length === 0 ? (
        <section className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 px-6 py-20 text-center">
          <p className="text-lg font-semibold text-slate-900">Todavía no hay torneos acá</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Si creaste uno en otro dispositivo, abrí tu enlace de administración y aparecerá en esta
            lista.
          </p>
          <Link
            href="/crear"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Crear mi primer torneo
          </Link>
        </section>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <li key={tournament.id}>
              <Link
                href={`/gestionar/${tournament.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-24">
                  <SportArt sport={tournament.sport} className="absolute inset-0 size-full" />
                  <div className="absolute inset-x-3 top-3 flex justify-between text-[11px] font-semibold">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-slate-800">
                      {STATUS_LABELS[tournament.status]}
                    </span>
                    {tournament.is_premium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-amber-950">
                        <Crown className="size-3" aria-hidden="true" /> Premium
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="truncate font-semibold text-slate-900">{tournament.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {tournament.sport} · {FORMAT_LABELS[tournament.format]}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" aria-hidden="true" />
                      {tournament.participant_count}
                      <span className="text-xs text-slate-400">
                        · {tournament.source === "account" ? "en tu cuenta" : "en este dispositivo"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium group-hover:text-brand">
                      Administrar <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

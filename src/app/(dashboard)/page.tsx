import { Plus, Trophy } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-8 py-10 lg:px-12">
      <header className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#39ff14]">
            TorneosPro
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Panel de Control
          </h1>
        </div>

        <Link
          href="/dashboard/crear"
          className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <Plus className="size-5" aria-hidden="true" />
          Crear Torneo
        </Link>
      </header>

      <section
        aria-labelledby="empty-state-title"
        className="mt-12 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 px-6 py-16"
      >
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#39ff14]/30 bg-[#39ff14]/10 text-[#39ff14]">
            <Trophy className="size-8" aria-hidden="true" />
          </div>
          <h2
            id="empty-state-title"
            className="mt-6 text-xl font-semibold text-white"
          >
            No tienes torneos activos
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Crea tu primer torneo para comenzar a gestionar participantes,
            partidas y resultados.
          </p>
        </div>
      </section>
    </div>
  );
}

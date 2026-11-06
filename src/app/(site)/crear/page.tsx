import { KeyRound, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";
import CreateTournamentForm from "./CreateTournamentForm";

export const metadata: Metadata = {
  title: "Crear torneo gratis",
  description:
    "Creá un torneo en segundos: pegá los participantes, elegí liga o eliminación directa y compartí el fixture. Gratis y sin registro.",
  alternates: { canonical: "/crear" },
};

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Nuevo torneo</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Creá tu torneo
        </h1>
        <p className="mt-3 text-slate-600">
          No necesitás cuenta. Al terminar te damos un enlace privado para administrarlo.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-1.5">
            <Zap className="size-4 text-brand" aria-hidden="true" /> Listo en 30 segundos
          </li>
          <li className="flex items-center gap-1.5">
            <KeyRound className="size-4 text-brand" aria-hidden="true" /> Sin registro
          </li>
          <li className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-brand" aria-hidden="true" /> Solo vos podés cargar resultados
          </li>
        </ul>
      </div>
      <CreateTournamentForm />
    </main>
  );
}

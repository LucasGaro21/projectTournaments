import Link from "next/link";

export default function TournamentNotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Este torneo no está disponible</h1>
      <p className="mt-3 text-slate-600">
        Puede que todavía no se haya publicado o que el organizador lo haya eliminado.
      </p>
      <Link
        href="/torneos"
        className="mt-8 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft"
      >
        Ver otros torneos
      </Link>
    </main>
  );
}

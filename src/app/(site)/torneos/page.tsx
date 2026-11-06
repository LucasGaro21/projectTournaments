import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import AdSlot from "@/components/ads/AdSlot";
import TournamentCard from "@/components/tournament/TournamentCard";
import { listPublicTournaments } from "@/lib/data/public";
import { isSport, SPORTS } from "@/lib/tournament/types";

export const metadata: Metadata = {
  title: "Torneos en juego",
  description:
    "Seguí torneos amateurs de pádel, fútbol, tenis y más: fixtures, resultados y tablas de posiciones actualizadas.",
  alternates: { canonical: "/torneos" },
};

const AD_EVERY = 6;

export default function ExplorePage({ searchParams }: PageProps<"/torneos">) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Torneos
      </h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Resultados y posiciones de torneos organizados con TorneosPro.
      </p>

      <Suspense fallback={<ListSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Results({
  searchParams,
}: {
  searchParams: PageProps<"/torneos">["searchParams"];
}) {
  const params = await searchParams;
  const sport = typeof params.deporte === "string" && isSport(params.deporte) ? params.deporte : undefined;
  const status = params.estado === "finalizado" ? "finalizado" : "activo";
  const tournaments = await listPublicTournaments({ sport, status, limit: 48 });

  const href = (next: { deporte?: string; estado?: string }) => {
    const query = new URLSearchParams();
    const nextSport = "deporte" in next ? next.deporte : sport;
    const nextStatus = next.estado ?? status;
    if (nextSport) query.set("deporte", nextSport);
    if (nextStatus !== "activo") query.set("estado", nextStatus);
    const search = query.toString();
    return search ? `/torneos?${search}` : "/torneos";
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm transition ${
      active
        ? "border-brand bg-brand/10 text-brand"
        : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
    }`;

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Estado">
        <Link href={href({ estado: "activo" })} className={chip(status === "activo")}>
          En juego
        </Link>
        <Link href={href({ estado: "finalizado" })} className={chip(status === "finalizado")}>
          Finalizados
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Deporte">
        <Link href={href({ deporte: undefined })} className={chip(!sport)}>
          Todos
        </Link>
        {SPORTS.map((item) => (
          <Link key={item} href={href({ deporte: item })} className={chip(sport === item)}>
            {item}
          </Link>
        ))}
      </div>

      <AdSlot placement="top" />

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">No hay torneos con estos filtros</p>
          <p className="mt-2 text-sm text-zinc-400">
            ¿Organizás uno?{" "}
            <Link href="/login?modo=registro" className="font-semibold text-brand">
              Crealo gratis
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament, index) => (
            <Fragment key={tournament.id}>
              <TournamentCard tournament={tournament} />
              {(index + 1) % AD_EVERY === 0 && index < tournaments.length - 1 ? (
                <div className="md:col-span-2 lg:col-span-3">
                  <AdSlot placement="inline" className="my-0" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-2xl bg-zinc-900/60" />
      ))}
    </div>
  );
}

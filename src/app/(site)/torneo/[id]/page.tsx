import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PublicTournamentView from "@/components/tournament/PublicTournamentView";
import { getPublicTournament } from "@/lib/data/public";
import { getSiteUrl } from "@/lib/env";
import { computeStandings, findChampion } from "@/lib/tournament/standings";
import { FORMAT_LABELS } from "@/lib/tournament/types";

export async function generateMetadata({
  params,
}: PageProps<"/torneo/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicTournament(id);

  if (!data) {
    return { title: "Torneo no encontrado", robots: { index: false } };
  }

  const { tournament, competitors, matches } = data;
  const champion = findChampion(tournament.format, competitors, matches);
  const leader =
    tournament.format === "Americano" ? computeStandings(competitors, matches)[0] : null;

  const headline = champion
    ? `Campeón: ${champion.name}.`
    : leader && leader.played > 0
      ? `Puntero: ${leader.name} (${leader.points} pts).`
      : "";

  const where = tournament.location ? ` en ${tournament.location}` : "";
  const description =
    `${tournament.sport} · ${FORMAT_LABELS[tournament.format]} · ` +
    `${tournament.participant_count} participantes${where}. ` +
    (headline ? `${headline} ` : "") +
    "Fixture, resultados y tabla de posiciones en vivo.";

  return {
    title: `${tournament.name} · ${tournament.sport}`,
    description,
    alternates: { canonical: `/torneo/${tournament.id}` },
    openGraph: {
      title: tournament.name,
      description,
      type: "website",
      url: `/torneo/${tournament.id}`,
    },
  };
}

export default function PublicTournamentPage({ params }: PageProps<"/torneo/[id]">) {
  return (
    <Suspense fallback={<TournamentSkeleton />}>
      <TournamentContent params={params} />
    </Suspense>
  );
}

async function TournamentContent({
  params,
}: {
  params: PageProps<"/torneo/[id]">["params"];
}) {
  const { id } = await params;
  const data = await getPublicTournament(id);
  if (!data) notFound();

  const shareUrl = `${getSiteUrl()}/torneo/${data.tournament.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: data.tournament.name,
    sport: data.tournament.sport,
    url: shareUrl,
    startDate: data.tournament.published_at ?? data.tournament.created_at,
    ...(data.tournament.finished_at ? { endDate: data.tournament.finished_at } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    ...(data.tournament.location
      ? { location: { "@type": "Place", name: data.tournament.location } }
      : {}),
    competitor: data.competitors.slice(0, 50).map((competitor) => ({
      "@type": "SportsTeam",
      name: competitor.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PublicTournamentView
        tournament={data.tournament}
        competitors={data.competitors}
        matches={data.matches}
        shareUrl={shareUrl}
      />
    </>
  );
}

function TournamentSkeleton() {
  return (
    <main aria-busy="true">
      <div className="h-72 animate-pulse bg-slate-800" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="mt-8 h-80 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    </main>
  );
}

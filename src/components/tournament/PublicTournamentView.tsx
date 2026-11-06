"use client";

import {
  CalendarClock,
  Crown,
  Info,
  MapPin,
  Printer,
  RefreshCw,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useSyncExternalStore } from "react";
import AdSlot from "@/components/ads/AdSlot";
import SportArt from "@/components/brand/SportArt";
import Bracket from "@/components/tournament/Bracket";
import MatchCard from "@/components/tournament/MatchCard";
import ShareButtons from "@/components/tournament/ShareButtons";
import StandingsTable from "@/components/tournament/StandingsTable";
import { knockoutRoundLabel } from "@/lib/tournament/fixture";
import { computeProgress, computeStandings, findChampion } from "@/lib/tournament/standings";
import {
  FORMAT_LABELS,
  STATUS_LABELS,
  type Competitor,
  type MatchRow,
  type PublicTournamentSummary,
} from "@/lib/tournament/types";
import { supabase } from "@/lib/supabase";

const REFRESH_MS = 45_000;

function useFollowedCompetitor(tournamentId: string) {
  const key = `torneospro:${tournamentId}:equipo`;

  const value = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("torneospro:follow", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("torneospro:follow", onChange);
      };
    },
    () => {
      try {
        return localStorage.getItem(key) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );

  function setValue(next: string) {
    try {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable (private mode); following is a convenience.
    }
    window.dispatchEvent(new Event("torneospro:follow"));
  }

  return [value, setValue] as const;
}

/** Re-fetches server data periodically while the tab is visible. Ads are not reloaded. */
function useLiveRefresh(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, router]);
}

/** Counts one view per browser session and tournament. */
function useViewCounter(tournamentId: string) {
  useEffect(() => {
    const key = `torneospro:view:${tournamentId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Count anyway when storage is unavailable.
    }
    void supabase.rpc("record_tournament_view", { p_tournament_id: tournamentId }).then(
      () => undefined,
      () => undefined,
    );
  }, [tournamentId]);
}

export default function PublicTournamentView({
  tournament,
  competitors,
  matches,
  shareUrl,
}: {
  tournament: PublicTournamentSummary;
  competitors: Competitor[];
  matches: MatchRow[];
  shareUrl: string;
}) {
  const [followedId, setFollowedId] = useFollowedCompetitor(tournament.id);
  const isKnockout = tournament.format === "Eliminatoria";
  const showAds = !tournament.is_premium;
  const isLive = tournament.status === "activo";

  useLiveRefresh(isLive);
  useViewCounter(tournament.id);

  const names = useMemo(
    () => new Map(competitors.map((competitor) => [competitor.id, competitor.name])),
    [competitors],
  );
  const standings = useMemo(() => computeStandings(competitors, matches), [competitors, matches]);
  const progress = computeProgress(matches);
  const champion = findChampion(tournament.format, competitors, matches);
  const followed = competitors.find((competitor) => competitor.id === followedId) ?? null;

  const rounds = useMemo(() => {
    const grouped = new Map<number, MatchRow[]>();
    for (const match of matches) {
      if (match.status === "bye") continue;
      const list = grouped.get(match.round_number) ?? [];
      list.push(match);
      grouped.set(match.round_number, list);
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b);
  }, [matches]);

  const totalRounds = Math.max(0, ...matches.map((match) => match.round_number));
  const currentRound =
    rounds.find(([, list]) => list.some((match) => match.status === "pendiente"))?.[0] ?? totalRounds;
  const roundLabel = (round: number) =>
    isKnockout ? knockoutRoundLabel(round, totalRounds) : `Fecha ${round}`;

  return (
    <main>
      {/* Cover */}
      <header className="relative overflow-hidden bg-ink text-white">
        <SportArt sport={tournament.sport} className="absolute inset-0 size-full opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{tournament.sport}</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              {FORMAT_LABELS[tournament.format]}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                isLive ? "bg-emerald-500" : "bg-white/15 backdrop-blur"
              }`}
            >
              {isLive ? <span className="size-1.5 animate-pulse rounded-full bg-white" /> : null}
              {STATUS_LABELS[tournament.status]}
            </span>
            {tournament.is_premium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-amber-950">
                <Crown className="size-3" aria-hidden="true" /> Premium
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">{tournament.name}</h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" /> {tournament.participant_count} participantes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-4" aria-hidden="true" /> {progress.played}/{progress.total} partidos
            </span>
            {tournament.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" /> {tournament.location}
              </span>
            ) : null}
          </div>
          <div className="mt-5 h-2 max-w-md overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-lime" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <ShareButtons url={shareUrl} title={tournament.name} tone="dark" />
            {tournament.is_premium ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
              >
                <Printer className="size-4" aria-hidden="true" /> Imprimir / PDF
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {showAds ? <AdSlot placement="top" className="mb-8" /> : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-10">
            {champion && tournament.status === "finalizado" ? (
              <section className="print-sheet flex items-center gap-4 rounded-3xl bg-gradient-to-r from-amber-300 to-amber-500 p-6 text-amber-950 shadow-sm">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/40">
                  <Trophy className="size-7" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Campeón</p>
                  <p className="text-2xl font-bold sm:text-3xl">{champion.name}</p>
                </div>
              </section>
            ) : null}

            <FollowPanel
              competitors={competitors}
              followed={followed}
              onChange={setFollowedId}
              matches={matches}
              names={names}
              position={followed && !isKnockout ? standings.findIndex((row) => row.id === followed.id) + 1 : null}
            />

            <section aria-labelledby="clasificacion" className="print-sheet">
              <h2 id="clasificacion" className="mb-4 text-xl font-bold text-slate-900">
                {isKnockout ? "Llave" : "Tabla de posiciones"}
              </h2>
              {isKnockout ? (
                <Bracket matches={matches} names={names} highlightId={followedId} />
              ) : (
                <StandingsTable rows={standings} highlightId={followedId} />
              )}
            </section>

            {showAds ? <AdSlot placement="inline" /> : null}

            <section aria-labelledby="partidos" className="print-sheet">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="partidos" className="text-xl font-bold text-slate-900">Partidos</h2>
                {isLive ? (
                  <span className="no-print inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <RefreshCw className="size-3.5" aria-hidden="true" /> Se actualiza solo
                  </span>
                ) : null}
              </div>
              <div className="space-y-3">
                {rounds.map(([round, list], index) => (
                  <Fragment key={round}>
                    <details
                      open={round === currentRound}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-slate-900 hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          {roundLabel(round)}
                          {round === currentRound && isLive ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                              Actual
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-3 text-xs font-medium text-slate-500">
                          {list.filter((match) => match.status === "finalizado").length}/{list.length}
                          <span className="transition group-open:rotate-180">▾</span>
                        </span>
                      </summary>
                      <div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
                        {list.map((match) => (
                          <MatchCard key={match.id} match={match} names={names} highlightId={followedId} />
                        ))}
                      </div>
                    </details>
                    {showAds && index === 3 && rounds.length > 6 ? <AdSlot placement="inline" /> : null}
                  </Fragment>
                ))}
              </div>
            </section>
          </div>

          <aside className="no-print space-y-6">
            {tournament.description ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="flex items-center gap-2 font-semibold text-slate-900">
                  <Info className="size-4 text-brand" aria-hidden="true" /> Información
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {tournament.description}
                </p>
              </section>
            ) : null}
            {showAds ? (
              <div className="lg:sticky lg:top-24">
                <AdSlot placement="sidebar" className="hidden lg:flex" />
              </div>
            ) : null}
          </aside>
        </div>

        {showAds ? <AdSlot placement="bottom" className="mt-12" /> : null}
      </div>
    </main>
  );
}

function FollowPanel({
  competitors,
  followed,
  onChange,
  matches,
  names,
  position,
}: {
  competitors: Competitor[];
  followed: Competitor | null;
  onChange: (id: string) => void;
  matches: MatchRow[];
  names: Map<string, string>;
  position: number | null;
}) {
  const sorted = [...competitors].sort((a, b) => a.name.localeCompare(b.name, "es"));

  if (!followed) {
    return (
      <section className="no-print flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label htmlFor="follow" className="flex items-center gap-2 font-semibold text-slate-900">
            <Star className="size-4 text-blue-600" aria-hidden="true" /> ¿Jugás en este torneo?
          </label>
          <p className="mt-0.5 text-sm text-slate-600">
            Elegí tu nombre para ver tu próximo partido y resaltarte en la tabla.
          </p>
        </div>
        <select
          id="follow"
          defaultValue=""
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 sm:w-64"
        >
          <option value="" disabled>Elegir participante…</option>
          {sorted.map((competitor) => (
            <option key={competitor.id} value={competitor.id}>{competitor.name}</option>
          ))}
        </select>
      </section>
    );
  }

  const mine = matches.filter(
    (match) =>
      match.status !== "bye" &&
      (match.competitor1_id === followed.id || match.competitor2_id === followed.id),
  );
  const next = mine.find((match) => match.status === "pendiente");
  const last = [...mine].reverse().find((match) => match.status === "finalizado");

  return (
    <section className="no-print rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <Star className="size-4 fill-blue-600 text-blue-600" aria-hidden="true" />
          Siguiendo a {followed.name}
          {position ? (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{position}º</span>
          ) : null}
        </p>
        <button type="button" onClick={() => onChange("")} className="text-sm font-medium text-blue-700 hover:underline">
          Cambiar
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Próximo partido</p>
          {next ? (
            <MatchCard match={next} names={names} highlightId={followed.id} />
          ) : (
            <p className="rounded-xl bg-white px-4 py-4 text-sm text-slate-500">No tenés partidos pendientes.</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Último resultado</p>
          {last ? (
            <MatchCard match={last} names={names} highlightId={followed.id} />
          ) : (
            <p className="rounded-xl bg-white px-4 py-4 text-sm text-slate-500">Todavía no jugaste.</p>
          )}
        </div>
      </div>
    </section>
  );
}

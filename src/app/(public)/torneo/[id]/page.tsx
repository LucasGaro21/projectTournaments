"use client";

import React, { useEffect, useState } from "react";
import { Download, LoaderCircle, Lock } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import LiveScoreCard, { type Match } from "@/components/LiveScoreCard";
import Leaderboard from "@/components/Leaderboard";
import AdBanner from "@/components/AdBanner";

type Competitor = {
  id: string;
  name: string;
};

type TournamentPageProps = {
  params: {
    id: string;
  };
};

type MatchRow = {
  id: string;
  round_number: number;
  competitor1_id: string;
  competitor2_id: string | null;
  status: Match["status"];
  score1: number | null;
  score2: number | null;
};

export default function TournamentPage({ params }: TournamentPageProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myCompetitorId, setMyCompetitorId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(`torneo_${params.id}_competitor`) ?? "";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasMagicLink, setHasMagicLink] = useState(false);
  const [isMagicLinkValid, setIsMagicLinkValid] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTournamentData() {
      try {
        const magicLinkToken = new URLSearchParams(window.location.search).get(
          "token",
        );
        setHasMagicLink(Boolean(magicLinkToken));

        const [
          { data: competitorRows, error: competitorsError },
          { data: matchRows, error: matchesError },
          { data: tournament, error: tournamentError },
        ] = await Promise.all([
          supabase
            .from("public_competitors")
            .select("id, name")
            .eq("tournament_id", params.id),
          supabase
            .from("public_matches")
            .select(
              "id, round_number, competitor1_id, competitor2_id, status, score1, score2",
            )
            .eq("tournament_id", params.id)
            .order("round_number", { ascending: true }),
          supabase
            .from("public_tournaments")
            .select("is_premium")
            .eq("id", params.id)
            .maybeSingle(),
        ]);

        if (competitorsError) {
          throw competitorsError;
        }

        if (matchesError) {
          throw matchesError;
        }

        if (tournamentError) {
          throw tournamentError;
        }

        if (!tournament) {
          setLoadError(
            "Este torneo todavía no está publicado o ya no existe.",
          );
          return;
        }

        const loadedCompetitors = (competitorRows ?? []) as Competitor[];
        const loadedMatches = (matchRows ?? []) as MatchRow[];
        if (magicLinkToken) {
          const { data: tokenIsValid, error: tokenError } = await supabase.rpc(
            "validate_magic_link",
            {
              p_tournament_id: params.id,
              p_token: magicLinkToken,
            },
          );

          if (tokenError) {
            throw tokenError;
          }

          if (!tokenIsValid) {
            setIsMagicLinkValid(false);
            return;
          }
        }

        const competitorsById = new Map(
          loadedCompetitors.map((competitor) => [competitor.id, competitor]),
        );

        setCompetitors(loadedCompetitors);
        setIsPremium(Boolean(tournament?.is_premium));
        setMatches(
          loadedMatches.map((match) => ({
            id: match.id,
            roundNumber: match.round_number,
            homeTeam: competitorsById.get(match.competitor1_id) ?? {
              id: match.competitor1_id,
              name: "Equipo desconocido",
            },
            awayTeam: match.competitor2_id
              ? competitorsById.get(match.competitor2_id) ?? {
                  id: match.competitor2_id,
                  name: "Equipo desconocido",
                }
              : null,
            status: match.status,
            score1: match.score1,
            score2: match.score2,
          })),
        );
      } catch (error) {
        console.error("Error al cargar el torneo:", error);
        setLoadError(
          "No se pudo cargar este torneo. Verificá que la configuración de Supabase esté completa.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchTournamentData();
  }, [params.id]);

  function selectCompetitor(competitorId: string) {
    localStorage.setItem(`torneo_${params.id}_competitor`, competitorId);
    setMyCompetitorId(competitorId);
  }

  function clearSelectedCompetitor() {
    localStorage.removeItem(`torneo_${params.id}_competitor`);
    setMyCompetitorId("");
  }

  async function handleExportPDF() {
    if (!isPremium) {
      alert("La exportación de planillas es exclusiva del plan Premium");
      return;
    }

    setIsExporting(true);

    try {
      const element = document.getElementById("export-container");

      if (!element) {
        throw new Error("No se encontró el contenido para exportar.");
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#09090b",
        scale: 2,
      });
      const imageData = canvas.toDataURL("image/png");
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      doc.addImage(imageData, "PNG", 0, 0, pageWidth, imageHeight);
      doc.save("Torneo-Export.pdf");
    } catch (error) {
      console.error("Error al exportar el torneo:", error);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">Cargando torneo...</p>
      </main>
    );
  }

  if (!isMagicLinkValid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <Lock className="mx-auto size-8 text-red-300" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-white">
            Enlace no válido
          </h1>
          <p className="mt-2 text-sm leading-6 text-red-200/80">
            Este enlace mágico no coincide con el torneo o ya no está disponible.
            Pedile al administrador que genere uno nuevo.
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold text-white">
            No se pudo cargar el torneo
          </h1>
          <p className="mt-2 text-sm leading-6 text-red-200/80">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!myCompetitorId) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100">
        <div className="mx-auto max-w-xl">
          <header className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">¿Qué equipo integras?</h1>
            <button
              type="button"
              onClick={() => void handleExportPDF()}
              disabled={isExporting}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? (
                <LoaderCircle
                  className="size-4 animate-spin text-[#39ff14]"
                  aria-hidden="true"
                />
              ) : isPremium ? (
                <Download className="size-4 text-[#39ff14]" aria-hidden="true" />
              ) : (
                <Lock className="size-4 text-zinc-400" aria-hidden="true" />
              )}
              {isExporting ? "Exportando..." : "Exportar PDF"}
            </button>
          </header>
          <p className="mt-2 text-sm text-zinc-400">
            Selecciona tu equipo para ver tus próximos partidos.
          </p>
          {hasMagicLink ? (
            <p className="mt-4 rounded-lg border border-[#39ff14]/20 bg-[#39ff14]/5 px-3 py-2 text-xs text-[#9bff8a]">
              Enlace mágico verificado. Elegí tu equipo para ver tu tablero personalizado.
            </p>
          ) : null}

          <div id="export-container">
            {!isPremium ? <AdBanner /> : null}

            <div className="mt-8 grid gap-3">
              {competitors.map((competitor) => (
                <button
                  key={competitor.id}
                  type="button"
                  onClick={() => selectCompetitor(competitor.id)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left font-medium transition-colors hover:border-[#39ff14] hover:bg-zinc-800"
                >
                  {competitor.name}
                </button>
              ))}
            </div>

            <Leaderboard competitors={competitors} matches={matches} />
            {!isPremium ? <AdBanner /> : null}
          </div>
        </div>
      </main>
    );
  }

  const myMatches = matches.filter(
    (match) =>
      match.homeTeam.id === myCompetitorId ||
      match.awayTeam?.id === myCompetitorId,
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Tus Partidos</h1>
          <button
            type="button"
            onClick={() => void handleExportPDF()}
            disabled={isExporting}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <LoaderCircle
                className="size-4 animate-spin text-[#39ff14]"
                aria-hidden="true"
              />
            ) : isPremium ? (
              <Download className="size-4 text-[#39ff14]" aria-hidden="true" />
            ) : (
              <Lock className="size-4 text-zinc-400" aria-hidden="true" />
            )}
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </button>
        </header>

        <div id="export-container">
          {!isPremium ? <AdBanner /> : null}

          <div className="mt-8 space-y-4">
            {myMatches.length > 0 ? (
              myMatches.map((match) => (
                <LiveScoreCard
                  key={match.id}
                  match={match}
                />
              ))
            ) : (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-sm text-zinc-400">
                No tienes partidos asignados.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={clearSelectedCompetitor}
            className="mt-10 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            No soy este jugador (Cambiar)
          </button>

          <Leaderboard competitors={competitors} matches={matches} />
          {!isPremium ? <AdBanner /> : null}
        </div>
      </div>

    </main>
  );
}

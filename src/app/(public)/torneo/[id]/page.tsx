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
  const [matchToScore, setMatchToScore] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchTournamentData() {
      try {
        const [
          { data: competitorRows, error: competitorsError },
          { data: matchRows, error: matchesError },
          { data: tournament, error: tournamentError },
        ] = await Promise.all([
          supabase
            .from("competitors")
            .select("id, name")
            .eq("tournament_id", params.id),
          supabase
            .from("matches")
            .select(
              "id, round_number, competitor1_id, competitor2_id, status, score1, score2",
            )
            .eq("tournament_id", params.id)
            .order("round_number", { ascending: true }),
          supabase
            .from("tournaments")
            .select("is_premium")
            .eq("id", params.id)
            .single(),
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

        const loadedCompetitors = (competitorRows ?? []) as Competitor[];
        const loadedMatches = (matchRows ?? []) as MatchRow[];
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

  function openScoreModal(matchId: string) {
    const match = matches.find((item) => item.id === matchId);

    setScore1(match?.score1?.toString() ?? "");
    setScore2(match?.score2?.toString() ?? "");
    setMatchToScore(matchId);
  }

  async function handleSaveScore(
    matchId: string,
    nextScore1: number,
    nextScore2: number,
  ) {
    setIsSubmittingScore(true);

    try {
      const { error } = await supabase
        .from("matches")
        .update({
          score1: nextScore1,
          score2: nextScore2,
          status: "finalizado",
        })
        .eq("id", matchId);

      if (error) {
        throw error;
      }

      setMatches((currentMatches) =>
        currentMatches.map((match) =>
          match.id === matchId
            ? {
                ...match,
                score1: nextScore1,
                score2: nextScore2,
                status: "finalizado",
              }
            : match,
        ),
      );
      setMatchToScore(null);
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
    } finally {
      setIsSubmittingScore(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">Cargando torneo...</p>
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
                  onLoadResult={(id) => openScoreModal(id)}
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

      {matchToScore ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            {(() => {
              const selectedMatch = matches.find(
                (match) => match.id === matchToScore,
              );

              if (!selectedMatch) {
                return null;
              }

              return (
                <>
                  <h2 className="text-xl font-bold text-zinc-100">
                    Cargar resultado
                  </h2>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <label className="text-center text-sm text-zinc-300">
                      <span className="block truncate">
                        {selectedMatch.homeTeam.name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={score1}
                        onChange={(event) => setScore1(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-center text-2xl font-bold text-white outline-none focus:border-[#39ff14]"
                      />
                    </label>
                    <label className="text-center text-sm text-zinc-300">
                      <span className="block truncate">
                        {selectedMatch.awayTeam?.name ?? "Bye"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={score2}
                        onChange={(event) => setScore2(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-center text-2xl font-bold text-white outline-none focus:border-[#39ff14]"
                      />
                    </label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setMatchToScore(null)}
                      className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={
                        isSubmittingScore ||
                        score1 === "" ||
                        score2 === "" ||
                        selectedMatch.awayTeam === null
                      }
                      onClick={() =>
                        void handleSaveScore(
                          selectedMatch.id,
                          Number(score1),
                          Number(score2),
                        )
                      }
                      className="rounded-lg bg-[#39ff14] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#6aff4d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingScore
                        ? "Guardando..."
                        : "Confirmar Resultado"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </main>
  );
}

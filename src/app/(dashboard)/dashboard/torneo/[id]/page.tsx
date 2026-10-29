"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  CreditCard,
  Crown,
  LoaderCircle,
  Globe2,
  Save,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LiveScoreCard, { type Match } from "@/components/LiveScoreCard";
import Leaderboard from "@/components/Leaderboard";

type Competitor = {
  id: string;
  name: string;
};

type Tournament = {
  id: string;
  name: string;
  status: string;
  is_premium: boolean;
  magic_link_token: string | null;
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

type TournamentPageProps = {
  params: {
    id: string;
  };
};

export default function TournamentAdminPage({
  params,
}: TournamentPageProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchToScore, setMatchToScore] = useState<string | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("payment");
  });

  useEffect(() => {
    async function fetchTournament() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw userError ?? new Error("No hay una sesión administrativa activa.");
        }

        const [
          { data: tournamentRow, error: tournamentError },
          { data: competitorRows, error: competitorsError },
          { data: matchRows, error: matchesError },
        ] = await Promise.all([
          supabase
            .from("tournaments")
            .select("id, name, status, is_premium, magic_link_token")
            .eq("id", params.id)
            .eq("owner_id", user.id)
            .single(),
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
        ]);

        if (tournamentError) throw tournamentError;
        if (competitorsError) throw competitorsError;
        if (matchesError) throw matchesError;

        const loadedCompetitors = (competitorRows ?? []) as Competitor[];
        const loadedMatches = (matchRows ?? []) as MatchRow[];
        const competitorsById = new Map(
          loadedCompetitors.map((competitor) => [competitor.id, competitor]),
        );

        setTournament(tournamentRow as Tournament);
        setCompetitors(loadedCompetitors);
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
      } catch (fetchError) {
        console.error("Error al cargar el torneo:", fetchError);
        setError("No se pudo cargar el torneo.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchTournament();
  }, [params.id]);

  function openScoreModal(matchId: string) {
    const match = matches.find((item) => item.id === matchId);
    if (!match || !match.awayTeam) return;

    setScore1(match.score1?.toString() ?? "");
    setScore2(match.score2?.toString() ?? "");
    setMatchToScore(matchId);
  }

  async function handleSaveScore(
    matchId: string,
    nextScore1: number,
    nextScore2: number,
  ) {
    if (
      !Number.isInteger(nextScore1) ||
      !Number.isInteger(nextScore2) ||
      nextScore1 < 0 ||
      nextScore2 < 0
    ) {
      setError("Los resultados deben ser números enteros iguales o mayores a cero.");
      return;
    }

    setIsSubmittingScore(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          score1: nextScore1,
          score2: nextScore2,
          status: "finalizado",
        })
        .eq("id", matchId)
        .eq("tournament_id", params.id);

      if (updateError) throw updateError;

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
    } catch (saveError) {
      console.error("Error al guardar el resultado:", saveError);
      setError("No se pudo guardar el resultado.");
    } finally {
      setIsSubmittingScore(false);
    }
  }

  async function handleUpgrade() {
    if (!tournament) return;

    setIsUpgrading(true);
    setError(null);

    try {
      const response = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: tournament.id }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error ?? "No se pudo iniciar el checkout.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (upgradeError) {
      console.error("Error al activar Premium:", upgradeError);
      setError("No se pudo activar Premium.");
    } finally {
      setIsUpgrading(false);
    }
  }

  async function handlePublish() {
    if (!tournament || tournament.status !== "borrador") return;

    if (competitors.length < 2) {
      setError("Agregá al menos 2 participantes antes de publicar el torneo.");
      return;
    }

    if (matches.length === 0) {
      setError("Generá el fixture antes de publicar el torneo.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const { data, error: publishError } = await supabase.rpc(
        "publish_tournament",
        { p_tournament_id: tournament.id },
      );

      if (publishError) throw publishError;
      setTournament(data as Tournament);
    } catch (publishError) {
      console.error("Error al publicar el torneo:", publishError);
      setError("No se pudo publicar el torneo.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleCopyLink() {
    if (!tournament?.magic_link_token) return;

    const link = `${window.location.origin}/torneo/${tournament.id}?token=${tournament.magic_link_token}`;
    await navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <LoaderCircle className="size-7 animate-spin text-[#39ff14]" />
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-red-400">
        {error ?? "No se encontró el torneo."}
      </main>
    );
  }

  const selectedMatch = matches.find((match) => match.id === matchToScore);
  const magicLink = tournament.magic_link_token
    ? `${window.location.origin}/torneo/${tournament.id}?token=${tournament.magic_link_token}`
    : "";

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a mis torneos
        </Link>

        <header className="mt-8 flex flex-col gap-5 border-b border-zinc-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#39ff14]">
              Panel de administración
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {tournament.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Trophy className="size-4 text-[#39ff14]" aria-hidden="true" />
            {competitors.length} participantes · {matches.length} partidos
          </div>
        </header>

        {tournament.status === "borrador" ? (
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-200">Torneo en borrador</p>
              <p className="mt-1 text-sm text-zinc-400">
                Publicalo cuando el fixture esté listo para habilitar el acceso de los jugadores.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={isPublishing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Globe2 className="size-4" aria-hidden="true" />
              )}
              {isPublishing ? "Publicando..." : "Publicar torneo"}
            </button>
          </section>
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#39ff14]/20 bg-[#39ff14]/5 px-3 py-1.5 text-xs font-medium text-[#9bff8a]">
            <Globe2 className="size-3.5" aria-hidden="true" />
            Torneo visible para jugadores
          </div>
        )}

        {error ? (
          <p role="alert" className="mt-6 text-sm text-red-400">
            {error}
          </p>
        ) : null}
        {paymentStatus === "success" && !tournament.is_premium ? (
          <p role="status" className="mt-6 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-200">
            Recibimos tu pago. Premium se activará cuando Mercado Pago confirme la operación.
          </p>
        ) : null}
        {paymentStatus === "pending" ? (
          <p role="status" className="mt-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
            El pago está pendiente de confirmación. Actualizaremos Premium cuando se acredite.
          </p>
        ) : null}
        {paymentStatus === "failure" ? (
          <p role="alert" className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            El pago no se completó. Podés intentar nuevamente cuando quieras.
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gestión de resultados</h2>
              <span className="text-xs uppercase tracking-wider text-zinc-600">
                Solo administrador
              </span>
            </div>
            <div className="space-y-4">
              {matches.map((match) => (
                <LiveScoreCard
                  key={match.id}
                  match={match}
                  onLoadResult={openScoreModal}
                />
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <Leaderboard competitors={competitors} matches={matches} />

            {!tournament.is_premium ? (
              <section className="rounded-2xl border border-[#39ff14] bg-zinc-900/50 p-6">
                <Crown className="size-7 text-[#39ff14]" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-bold">
                  Desbloquea el Máximo Potencial
                </h2>
                <ul className="mt-5 space-y-3 text-sm text-zinc-300">
                  {[
                    "Sin anuncios para tus jugadores",
                    "Exportación de planillas en PDF",
                    "Enlace mágico para compartir",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle className="size-4 text-[#39ff14]" aria-hidden="true" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void handleUpgrade()}
                  disabled={isUpgrading}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#009EE3] px-4 py-3 text-sm font-semibold text-white hover:bg-[#008dcc] disabled:opacity-60"
                >
                  <CreditCard className="size-4" aria-hidden="true" />
                  {isUpgrading ? "Procesando pago..." : "Pagar con Mercado Pago"}
                </button>
              </section>
            ) : (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center gap-2">
                  <Crown className="size-5 text-[#39ff14]" aria-hidden="true" />
                  <h2 className="font-semibold">Torneo Premium Activo</h2>
                </div>
                <div className="mt-5 flex gap-2">
                  <input
                    readOnly
                    value={magicLink}
                    aria-label="Enlace mágico"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-[#39ff14] hover:text-[#39ff14]"
                  >
                    <Copy className="size-3.5" aria-hidden="true" />
                    {isCopied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      {selectedMatch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-bold">Cargar resultado</h2>
            <p className="mt-2 text-sm text-zinc-500">
              {selectedMatch.homeTeam.name} vs. {selectedMatch.awayTeam?.name}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <input
                type="number"
                min="0"
                step="1"
                max="999"
                value={score1}
                onChange={(event) => setScore1(event.target.value)}
                aria-label={`Puntos de ${selectedMatch.homeTeam.name}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-4 text-center text-3xl font-bold text-white focus:border-[#39ff14] focus:outline-none"
              />
              <input
                type="number"
                min="0"
                step="1"
                max="999"
                value={score2}
                onChange={(event) => setScore2(event.target.value)}
                aria-label={`Puntos de ${selectedMatch.awayTeam?.name}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-4 text-center text-3xl font-bold text-white focus:border-[#39ff14] focus:outline-none"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMatchToScore(null)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isSubmittingScore ||
                  score1 === "" ||
                  score2 === "" ||
                  !/^\d+$/.test(score1) ||
                  !/^\d+$/.test(score2) ||
                  Number(score1) > 999 ||
                  Number(score2) > 999
                }
                onClick={() =>
                  void handleSaveScore(
                    selectedMatch.id,
                    Number(score1),
                    Number(score2),
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#39ff14] px-4 py-2 text-sm font-bold text-black hover:bg-[#6aff4d] disabled:opacity-60"
              >
                {isSubmittingScore ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {isSubmittingScore ? "Guardando..." : "Guardar resultado"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

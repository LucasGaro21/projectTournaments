"use client";

import { Trophy } from "lucide-react";
import type { Match } from "@/components/LiveScoreCard";

type Competitor = {
  id: string;
  name: string;
};

type LeaderboardProps = {
  competitors: Competitor[];
  matches: Match[];
};

type CompetitorStats = Competitor & {
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  difference: number;
};

export default function Leaderboard({
  competitors,
  matches,
}: LeaderboardProps) {
  const standings = competitors
    .map<CompetitorStats>((competitor) => {
      const completedMatches = matches.filter(
        (match) =>
          match.status === "finalizado" &&
          match.awayTeam !== null &&
          (match.homeTeam.id === competitor.id ||
            match.awayTeam.id === competitor.id),
      );

      const stats = completedMatches.reduce(
        (accumulator, match) => {
          const isHomeTeam = match.homeTeam.id === competitor.id;
          const competitorScore = isHomeTeam
            ? (match.score1 ?? 0)
            : (match.score2 ?? 0);
          const opponentScore = isHomeTeam
            ? (match.score2 ?? 0)
            : (match.score1 ?? 0);

          return {
            played: accumulator.played + 1,
            wins:
              accumulator.wins + (competitorScore > opponentScore ? 1 : 0),
            losses:
              accumulator.losses + (competitorScore < opponentScore ? 1 : 0),
            pointsFor: accumulator.pointsFor + competitorScore,
            pointsAgainst: accumulator.pointsAgainst + opponentScore,
          };
        },
        {
          played: 0,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        },
      );

      return {
        ...competitor,
        ...stats,
        difference: stats.pointsFor - stats.pointsAgainst,
      };
    })
    .sort(
      (firstCompetitor, secondCompetitor) =>
        secondCompetitor.wins - firstCompetitor.wins ||
        secondCompetitor.difference - firstCompetitor.difference,
    );

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-zinc-100">
        Tabla de Posiciones
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[640px] bg-zinc-950 text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Equipo</th>
              <th className="px-4 py-3 text-center font-medium">PJ</th>
              <th className="px-4 py-3 text-center font-medium">PG</th>
              <th className="px-4 py-3 text-center font-medium">PP</th>
              <th className="px-4 py-3 text-center font-medium">PF</th>
              <th className="px-4 py-3 text-center font-medium">PC</th>
              <th className="px-4 py-3 text-center font-medium">DIF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {standings.map((competitor, index) => (
              <tr
                key={competitor.id}
                className={index === 0 ? "bg-[#39ff14]/5" : undefined}
              >
                <td
                  className={`px-4 py-4 font-semibold ${
                    index === 0 ? "text-[#39ff14]" : "text-zinc-500"
                  }`}
                >
                  {index === 0 ? (
                    <Trophy className="size-4" aria-label="Primer lugar" />
                  ) : (
                    index + 1
                  )}
                </td>
                <td
                  className={`px-4 py-4 font-medium ${
                    index === 0 ? "text-[#39ff14]" : "text-zinc-100"
                  }`}
                >
                  {competitor.name}
                </td>
                <td className="px-4 py-4 text-center text-zinc-300">
                  {competitor.played}
                </td>
                <td className="px-4 py-4 text-center text-zinc-300">
                  {competitor.wins}
                </td>
                <td className="px-4 py-4 text-center text-zinc-300">
                  {competitor.losses}
                </td>
                <td className="px-4 py-4 text-center text-zinc-300">
                  {competitor.pointsFor}
                </td>
                <td className="px-4 py-4 text-center text-zinc-300">
                  {competitor.pointsAgainst}
                </td>
                <td className="px-4 py-4 text-center font-semibold text-zinc-100">
                  {competitor.difference > 0
                    ? `+${competitor.difference}`
                    : competitor.difference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

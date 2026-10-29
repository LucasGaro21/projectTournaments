export type MatchTeam = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  roundNumber: number;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam | null;
  status: string;
  score1: number | null;
  score2: number | null;
};

export default function LiveScoreCard({
  match,
  onLoadResult,
}: {
  match: Match;
  onLoadResult?: (id: string) => void;
}) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        Ronda {match.roundNumber}
      </p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="font-medium text-zinc-100">{match.homeTeam.name}</span>
        <span className="text-lg font-bold text-zinc-100">
          {match.score1 ?? "-"} : {match.score2 ?? "-"}
        </span>
        <span className="text-right font-medium text-zinc-100">
          {match.awayTeam?.name ?? "Bye"}
        </span>
      </div>
      {match.awayTeam && onLoadResult ? (
        <button
          type="button"
          onClick={() => onLoadResult(match.id)}
          className="mt-4 w-full rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-[#39ff14] hover:text-[#39ff14]"
        >
          Cargar resultado
        </button>
      ) : match.status === "finalizado" ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500">
          <Lock className="size-3.5" aria-hidden="true" />
          Resultado finalizado
        </div>
      ) : null}
    </article>
  );
}
import { Lock } from "lucide-react";

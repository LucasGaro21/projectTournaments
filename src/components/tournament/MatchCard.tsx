import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/tournament/types";

export default function MatchCard({
  match,
  names,
  highlightId,
  action,
}: {
  match: MatchRow;
  names: Map<string, string>;
  highlightId?: string | null;
  action?: ReactNode;
}) {
  const isPlayed = match.status === "finalizado";
  const isBye = match.status === "bye";
  const involvesMe =
    Boolean(highlightId) &&
    (match.competitor1_id === highlightId || match.competitor2_id === highlightId);

  const side = (id: string | null, score: number | null) => {
    const name = id ? names.get(id) : null;
    const isWinner = isPlayed && id !== null && match.winner_id === id;
    const isLoser = isPlayed && match.winner_id !== null && id !== match.winner_id;

    return (
      <div className="flex items-center justify-between gap-3">
        <span
          className={`min-w-0 truncate ${
            !name
              ? "italic text-slate-400"
              : isWinner
                ? "font-semibold text-slate-900"
                : isLoser
                  ? "text-slate-400"
                  : "font-medium text-slate-700"
          } ${id && id === highlightId ? "text-blue-700" : ""}`}
        >
          {name ?? (isBye ? "Libre" : "A definir")}
        </span>
        <span
          className={`w-8 shrink-0 text-right font-mono text-base tabular-nums ${
            isWinner ? "font-bold text-slate-900" : "text-slate-500"
          }`}
        >
          {isPlayed ? score : ""}
        </span>
      </div>
    );
  };

  return (
    <article
      className={`rounded-xl border bg-white p-3.5 shadow-sm ${
        involvesMe ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="space-y-1.5 text-sm">
        {side(match.competitor1_id, match.score1)}
        {side(match.competitor2_id, match.score2)}
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-medium uppercase tracking-wider">
        {isPlayed ? (
          <span className="text-emerald-600">Final</span>
        ) : isBye ? (
          <span className="text-slate-400">Pasa directo</span>
        ) : (
          <span className="text-amber-600">Por jugar</span>
        )}
      </div>
      {action ? <div className="mt-2.5">{action}</div> : null}
    </article>
  );
}

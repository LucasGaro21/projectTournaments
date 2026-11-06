import { Crown } from "lucide-react";
import { knockoutRoundLabel } from "@/lib/tournament/fixture";
import type { MatchRow } from "@/lib/tournament/types";

/** Horizontal knockout bracket. Scrolls sideways on small screens. */
export default function Bracket({
  matches,
  names,
  highlightId,
}: {
  matches: MatchRow[];
  names: Map<string, string>;
  highlightId?: string | null;
}) {
  const rounds = new Map<number, MatchRow[]>();
  for (const match of matches) {
    const list = rounds.get(match.round_number) ?? [];
    list.push(match);
    rounds.set(match.round_number, list);
  }

  const roundNumbers = [...rounds.keys()].sort((a, b) => a - b);
  const totalRounds = roundNumbers.at(-1) ?? 0;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-max gap-5">
        {roundNumbers.map((round) => (
          <section key={round} className="flex w-52 flex-col">
            <h3 className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {knockoutRoundLabel(round, totalRounds)}
            </h3>
            <ol className="flex flex-1 flex-col justify-around gap-3">
              {rounds
                .get(round)!
                .sort((a, b) => a.position - b.position)
                .map((match) => (
                  <li key={match.id}>
                    <BracketMatch
                      match={match}
                      names={names}
                      highlightId={highlightId}
                      isFinal={round === totalRounds}
                    />
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  names,
  highlightId,
  isFinal,
}: {
  match: MatchRow;
  names: Map<string, string>;
  highlightId?: string | null;
  isFinal: boolean;
}) {
  const rows = [
    { id: match.competitor1_id, score: match.score1 },
    { id: match.competitor2_id, score: match.score2 },
  ];

  return (
    <div
      className={`overflow-hidden rounded-xl border text-sm ${
        isFinal ? "border-amber-300 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]" : "border-slate-200"
      }`}
    >
      {rows.map(({ id, score }, index) => {
        const name = id ? names.get(id) : null;
        const isWinner = match.status !== "pendiente" && id !== null && id === match.winner_id;

        return (
          <div
            key={index}
            className={`flex items-center justify-between gap-2 px-3 py-2 ${
              index === 0 ? "border-b border-slate-100" : ""
            } ${id && id === highlightId ? "bg-blue-50" : isWinner ? "bg-emerald-50/60" : "bg-white"}`}
          >
            <span
              className={`flex min-w-0 items-center gap-1.5 truncate ${
                isWinner ? "font-semibold text-slate-900" : name ? "text-slate-500" : "italic text-slate-300"
              }`}
            >
              {isWinner && isFinal ? (
                <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="Campeón" />
              ) : null}
              {name ?? (match.status === "bye" && index === 1 ? "Libre" : "A definir")}
            </span>
            <span className="font-mono tabular-nums text-slate-700">
              {match.status === "finalizado" ? score : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

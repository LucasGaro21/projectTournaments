import type { Competitor, MatchRow } from "./types";

export type PointsRule = { win: number; draw: number; loss: number };

export const DEFAULT_POINTS: PointsRule = { win: 3, draw: 1, loss: 0 };

export type StandingRow = Competitor & {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scored: number;
  conceded: number;
  difference: number;
  points: number;
};

type ResultMatch = Pick<
  MatchRow,
  "competitor1_id" | "competitor2_id" | "score1" | "score2" | "status"
>;

/**
 * League table. Order: points, score difference, scored, then name so the
 * output is deterministic.
 */
export function computeStandings(
  competitors: Competitor[],
  matches: ResultMatch[],
  rule: PointsRule = DEFAULT_POINTS,
): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    competitors.map((competitor) => [
      competitor.id,
      {
        ...competitor,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        scored: 0,
        conceded: 0,
        difference: 0,
        points: 0,
      },
    ]),
  );

  for (const match of matches) {
    if (
      match.status !== "finalizado" ||
      match.score1 === null ||
      match.score2 === null ||
      !match.competitor1_id ||
      !match.competitor2_id
    ) {
      continue;
    }

    const home = rows.get(match.competitor1_id);
    const away = rows.get(match.competitor2_id);
    if (!home || !away) continue;

    apply(home, match.score1, match.score2, rule);
    apply(away, match.score2, match.score1, rule);
  }

  return [...rows.values()].sort(
    (first, second) =>
      second.points - first.points ||
      second.difference - first.difference ||
      second.scored - first.scored ||
      first.name.localeCompare(second.name, "es"),
  );
}

function apply(row: StandingRow, scored: number, conceded: number, rule: PointsRule) {
  row.played += 1;
  row.scored += scored;
  row.conceded += conceded;
  row.difference = row.scored - row.conceded;

  if (scored > conceded) {
    row.won += 1;
    row.points += rule.win;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += rule.draw;
  } else {
    row.lost += 1;
    row.points += rule.loss;
  }
}

export type TournamentProgress = {
  played: number;
  total: number;
  percent: number;
};

export function computeProgress(matches: Pick<MatchRow, "status">[]): TournamentProgress {
  const playable = matches.filter((match) => match.status !== "bye");
  const played = playable.filter((match) => match.status === "finalizado").length;
  const total = playable.length;

  return {
    played,
    total,
    percent: total === 0 ? 0 : Math.round((played / total) * 100),
  };
}

/** Winner of the last knockout round, or the league leader once finished. */
export function findChampion(
  format: "Americano" | "Eliminatoria",
  competitors: Competitor[],
  matches: MatchRow[],
): Competitor | null {
  const byId = new Map(competitors.map((competitor) => [competitor.id, competitor]));

  if (format === "Eliminatoria") {
    const lastRound = Math.max(0, ...matches.map((match) => match.round_number));
    const final = matches.find((match) => match.round_number === lastRound);
    return final?.status === "finalizado" && final.winner_id
      ? (byId.get(final.winner_id) ?? null)
      : null;
  }

  const pending = matches.some((match) => match.status === "pendiente");
  if (pending) return null;

  const [leader] = computeStandings(competitors, matches);
  return leader && leader.played > 0 ? leader : null;
}

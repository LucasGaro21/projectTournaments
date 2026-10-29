export type Competitor = {
  id: string;
  name: string;
};

export type TournamentFormat = "Americano" | "Eliminatoria";

export type Match = {
  round_number: number;
  competitor1_name: string;
  competitor2_name: string | null;
  status: "pendiente";
};

export function parseParticipants(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function generateAmericanoFixture(
  competitors: Array<Pick<Competitor, "name">>,
): Match[] {
  if (competitors.length < 2) {
    return [];
  }

  const players: Array<Pick<Competitor, "name"> | null> = [...competitors];

  if (players.length % 2 !== 0) {
    players.push(null);
  }

  const rounds = players.length - 1;
  const matchesPerRound = players.length / 2;
  const fixture: Match[] = [];

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex += 1) {
      const firstCompetitor = players[matchIndex];
      const secondCompetitor = players[players.length - 1 - matchIndex];

      if (firstCompetitor === null && secondCompetitor === null) {
        continue;
      }

      fixture.push({
        round_number: roundIndex + 1,
        competitor1_name: firstCompetitor?.name ?? secondCompetitor!.name,
        competitor2_name:
          firstCompetitor === null ? null : secondCompetitor?.name ?? null,
        status: "pendiente",
      });
    }

    const fixedCompetitor = players[0];
    const rotatingCompetitors = players.slice(1);
    const lastCompetitor = rotatingCompetitors.pop()!;

    players.splice(
      0,
      players.length,
      fixedCompetitor,
      lastCompetitor,
      ...rotatingCompetitors,
    );
  }

  return fixture;
}

export function generateEliminationFixture(
  competitors: Array<Pick<Competitor, "name">>,
): Match[] {
  if (competitors.length < 2) {
    return [];
  }

  const bracketSize = 2 ** Math.ceil(Math.log2(competitors.length));
  const fixture: Match[] = [];

  for (let index = 0; index < bracketSize / 2; index += 1) {
    const firstCompetitor = competitors[index] ?? null;
    const secondCompetitor = competitors[bracketSize - 1 - index] ?? null;

    if (!firstCompetitor && !secondCompetitor) {
      continue;
    }

    fixture.push({
      round_number: 1,
      competitor1_name: firstCompetitor?.name ?? secondCompetitor!.name,
      competitor2_name: firstCompetitor ? secondCompetitor?.name ?? null : null,
      status: "pendiente",
    });
  }

  return fixture;
}

export function generateFixture(
  competitors: Array<Pick<Competitor, "name">>,
  format: TournamentFormat,
): Match[] {
  return format === "Eliminatoria"
    ? generateEliminationFixture(competitors)
    : generateAmericanoFixture(competitors);
}

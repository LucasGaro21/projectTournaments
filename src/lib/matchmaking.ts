export type Competitor = {
  id: string;
  name: string;
};

export type Match = {
  tournament_id: string;
  round_number: number;
  competitor1_id: string;
  competitor2_id: string | null;
  status: "pendiente";
};

export function parseParticipants(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function generateAmericanoFixture(
  competitors: Competitor[],
  tournamentId: string,
): Match[] {
  if (competitors.length < 2) {
    return [];
  }

  const players: Array<Competitor | null> = [...competitors];

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
        tournament_id: tournamentId,
        round_number: roundIndex + 1,
        competitor1_id: firstCompetitor?.id ?? secondCompetitor!.id,
        competitor2_id: firstCompetitor === null ? null : secondCompetitor?.id ?? null,
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

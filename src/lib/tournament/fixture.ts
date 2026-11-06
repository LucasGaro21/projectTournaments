import type { TournamentFormat } from "./types";

/**
 * A fixture entry as sent to the `create_tournament` database function.
 * Participants are referenced by name because their ids do not exist yet.
 */
export type FixtureMatch = {
  round_number: number;
  position: number;
  competitor1_name: string;
  competitor2_name: string | null;
};

const LIST_PREFIX = /^\s*(?:\d{1,3}\s*[.)\-:]|[-*•·–])\s*/;

/**
 * Turns pasted text (usually a WhatsApp message) into a clean list of names:
 * one per line, list markers like "1." or "•" removed, blank lines dropped.
 */
export function parseParticipants(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(LIST_PREFIX, "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

export function findDuplicateNames(names: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of names) {
    const key = name.toLocaleLowerCase("es");
    if (seen.has(key)) duplicates.add(name);
    seen.add(key);
  }

  return [...duplicates];
}

/** Fisher–Yates shuffle with an injectable random source for tests. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

/**
 * Round robin using the circle method. Every pair meets exactly once and each
 * participant plays at most once per round. With an odd number of
 * participants one of them rests each round (no row is generated for it).
 */
export function generateRoundRobin(names: string[]): FixtureMatch[] {
  if (names.length < 2) return [];

  const slots: Array<string | null> = [...names];
  if (slots.length % 2 !== 0) slots.push(null);

  const roundCount = slots.length - 1;
  const half = slots.length / 2;
  const fixture: FixtureMatch[] = [];

  for (let round = 0; round < roundCount; round += 1) {
    let position = 0;

    for (let index = 0; index < half; index += 1) {
      const home = slots[index];
      const away = slots[slots.length - 1 - index];
      if (home === null || away === null) continue;

      // Alternate home/away for the fixed participant so it is not always first.
      const swap = index === 0 && round % 2 === 1;
      fixture.push({
        round_number: round + 1,
        position,
        competitor1_name: swap ? away : home,
        competitor2_name: swap ? home : away,
      });
      position += 1;
    }

    // Keep slot 0 fixed and rotate the rest clockwise.
    const last = slots.pop()!;
    slots.splice(1, 0, last);
  }

  return fixture;
}

export function nextPowerOfTwo(value: number): number {
  let size = 1;
  while (size < value) size *= 2;
  return size;
}

/**
 * Standard bracket seed order, e.g. for 8: [1, 8, 4, 5, 2, 7, 3, 6].
 * Top seeds meet as late as possible and byes land on the top seeds.
 */
export function seedOrder(bracketSize: number): number[] {
  let order = [1];

  while (order.length < bracketSize) {
    const size = order.length * 2;
    order = order.flatMap((seed) => [seed, size + 1 - seed]);
  }

  return order;
}

/**
 * First round of a single-elimination bracket. Participants are seeded in the
 * order given. Missing opponents are byes; the database creates the remaining
 * rounds and advances bye winners automatically.
 */
export function generateKnockoutFirstRound(names: string[]): FixtureMatch[] {
  if (names.length < 2) return [];

  const order = seedOrder(nextPowerOfTwo(names.length));
  const fixture: FixtureMatch[] = [];

  for (let index = 0; index < order.length; index += 2) {
    const home = names[order[index] - 1];
    const away = names[order[index + 1] - 1] ?? null;

    fixture.push({
      round_number: 1,
      position: index / 2,
      competitor1_name: home,
      competitor2_name: away,
    });
  }

  return fixture;
}

export function generateFixture(
  names: string[],
  format: TournamentFormat,
): FixtureMatch[] {
  return format === "Eliminatoria"
    ? generateKnockoutFirstRound(names)
    : generateRoundRobin(names);
}

export function knockoutRoundCount(participantCount: number): number {
  return Math.log2(nextPowerOfTwo(Math.max(2, participantCount)));
}

export function knockoutRoundLabel(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinales";
  if (remaining === 2) return "Cuartos de final";
  if (remaining === 3) return "Octavos de final";
  if (remaining === 4) return "16avos de final";
  return `Ronda ${round}`;
}

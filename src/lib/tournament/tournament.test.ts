import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findDuplicateNames,
  generateKnockoutFirstRound,
  generateRoundRobin,
  knockoutRoundCount,
  knockoutRoundLabel,
  parseParticipants,
  seedOrder,
  shuffle,
} from "./fixture.ts";
import { computeProgress, computeStandings, findChampion } from "./standings.ts";
import type { MatchRow } from "./types.ts";

const names = (count: number) =>
  Array.from({ length: count }, (_, index) => `P${index + 1}`);

describe("parseParticipants", () => {
  it("cleans WhatsApp style lists", () => {
    assert.deepEqual(
      parseParticipants("1. Juan  Pérez\r\n\n2) María\n- Los Tigres\n• Ana\n   \n"),
      ["Juan Pérez", "María", "Los Tigres", "Ana"],
    );
  });

  it("keeps names that start with numbers but are not list markers", () => {
    assert.deepEqual(parseParticipants("River 1986"), ["River 1986"]);
  });

  it("detects case-insensitive duplicates", () => {
    assert.deepEqual(findDuplicateNames(["Ana", "Luis", "ana"]), ["ana"]);
  });
});

describe("generateRoundRobin", () => {
  for (const count of [2, 3, 4, 5, 8, 11]) {
    it(`covers every pair exactly once with ${count} participants`, () => {
      const fixture = generateRoundRobin(names(count));
      const pairs = new Set(
        fixture.map((match) =>
          [match.competitor1_name, match.competitor2_name].sort().join("|"),
        ),
      );

      assert.equal(fixture.length, (count * (count - 1)) / 2);
      assert.equal(pairs.size, fixture.length);

      const rounds = new Map<number, string[]>();
      for (const match of fixture) {
        const playing = rounds.get(match.round_number) ?? [];
        playing.push(match.competitor1_name, match.competitor2_name!);
        rounds.set(match.round_number, playing);
      }

      for (const playing of rounds.values()) {
        assert.equal(new Set(playing).size, playing.length, "nobody plays twice per round");
      }

      assert.equal(rounds.size, count % 2 === 0 ? count - 1 : count);
    });
  }
});

describe("knockout bracket", () => {
  it("produces the standard seed order", () => {
    assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("gives byes to the top seeds and never pairs two byes", () => {
    const fixture = generateKnockoutFirstRound(names(6));

    assert.equal(fixture.length, 4);
    assert.deepEqual(
      fixture.map((match) => [match.competitor1_name, match.competitor2_name]),
      [
        ["P1", null],
        ["P4", "P5"],
        ["P2", null],
        ["P3", "P6"],
      ],
    );
    assert.deepEqual(
      fixture.map((match) => match.position),
      [0, 1, 2, 3],
    );
  });

  it("includes every participant exactly once", () => {
    for (const count of [2, 3, 5, 9, 16, 17]) {
      const fixture = generateKnockoutFirstRound(names(count));
      const entrants = fixture.flatMap((match) =>
        [match.competitor1_name, match.competitor2_name].filter(Boolean),
      );
      assert.equal(entrants.length, count);
      assert.equal(new Set(entrants).size, count);
    }
  });

  it("labels rounds", () => {
    assert.equal(knockoutRoundCount(6), 3);
    assert.equal(knockoutRoundLabel(1, 3), "Cuartos de final");
    assert.equal(knockoutRoundLabel(3, 3), "Final");
  });
});

describe("shuffle", () => {
  it("is a permutation", () => {
    const shuffled = shuffle(names(10));
    assert.deepEqual([...shuffled].sort(), names(10).sort());
  });
});

const match = (overrides: Partial<MatchRow>): MatchRow => ({
  id: crypto.randomUUID(),
  round_number: 1,
  position: 0,
  competitor1_id: null,
  competitor2_id: null,
  status: "pendiente",
  score1: null,
  score2: null,
  winner_id: null,
  ...overrides,
});

describe("standings", () => {
  const competitors = [
    { id: "a", name: "Ana" },
    { id: "b", name: "Beto" },
    { id: "c", name: "Caro" },
  ];

  const matches = [
    match({ competitor1_id: "a", competitor2_id: "b", score1: 2, score2: 2, status: "finalizado" }),
    match({ competitor1_id: "a", competitor2_id: "c", score1: 3, score2: 0, status: "finalizado" }),
    match({ competitor1_id: "b", competitor2_id: "c", score1: 1, score2: 0, status: "finalizado" }),
  ];

  it("awards 3/1/0 and sorts by points then difference", () => {
    const table = computeStandings(competitors, matches);

    assert.deepEqual(
      table.map((row) => [row.id, row.points, row.difference]),
      [
        ["a", 4, 3],
        ["b", 4, 1],
        ["c", 0, -4],
      ],
    );
    assert.equal(table[0].drawn, 1);
  });

  it("ignores pending matches and reports progress", () => {
    const withPending = [...matches, match({ competitor1_id: "a", competitor2_id: "b" })];
    assert.equal(computeStandings(competitors, withPending)[0].played, 2);
    assert.deepEqual(computeProgress(withPending), { played: 3, total: 4, percent: 75 });
    assert.equal(findChampion("Americano", competitors, withPending), null);
    assert.equal(findChampion("Americano", competitors, matches)?.id, "a");
  });

  it("finds the knockout champion from the final", () => {
    const bracket = [
      match({ round_number: 1, competitor1_id: "a", competitor2_id: "b", score1: 1, score2: 0, status: "finalizado", winner_id: "a" }),
      match({ round_number: 2, competitor1_id: "a", competitor2_id: "c", score1: 0, score2: 2, status: "finalizado", winner_id: "c" }),
    ];
    assert.equal(findChampion("Eliminatoria", competitors, bracket)?.name, "Caro");
  });
});

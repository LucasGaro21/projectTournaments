import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase-public";
import {
  isUuid,
  type Competitor,
  type MatchRow,
  type PublicTournamentSummary,
} from "@/lib/tournament/types";
import { PUBLIC_TOURNAMENTS_TAG, tournamentTag } from "./tags";

export type PublicTournament = {
  tournament: PublicTournamentSummary;
  competitors: Competitor[];
  matches: MatchRow[];
};

const SUMMARY_COLUMNS =
  "id, name, format, sport, location, status, is_premium, created_at, published_at, finished_at, participant_count, played_count, match_count";

/**
 * Everything a public tournament page needs. Cached per tournament and
 * invalidated by tag whenever the organizer changes something, so thousands
 * of players refreshing the page cost a single database read.
 */
export async function getPublicTournament(id: string): Promise<PublicTournament | null> {
  "use cache";
  cacheLife("live");
  cacheTag(tournamentTag(id));

  const supabase = getPublicSupabase();
  if (!supabase || !isUuid(id)) return null;

  const [tournamentResult, competitorsResult, matchesResult] = await Promise.all([
    supabase.from("public_tournaments").select(SUMMARY_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("public_competitors").select("id, name").eq("tournament_id", id).order("name"),
    supabase
      .from("public_matches")
      .select(
        "id, round_number, position, competitor1_id, competitor2_id, status, score1, score2, winner_id",
      )
      .eq("tournament_id", id)
      .order("round_number")
      .order("position"),
  ]);

  if (tournamentResult.error) throw tournamentResult.error;
  if (competitorsResult.error) throw competitorsResult.error;
  if (matchesResult.error) throw matchesResult.error;
  if (!tournamentResult.data) return null;

  return {
    tournament: tournamentResult.data as PublicTournamentSummary,
    competitors: (competitorsResult.data ?? []) as Competitor[],
    matches: (matchesResult.data ?? []) as MatchRow[],
  };
}

export type TournamentListFilter = {
  status?: "activo" | "finalizado";
  sport?: string;
  limit?: number;
};

/** Public directory. Premium tournaments are featured first. */
export async function listPublicTournaments(
  filter: TournamentListFilter = {},
): Promise<PublicTournamentSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_TOURNAMENTS_TAG);

  const supabase = getPublicSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("public_tournaments")
    .select(SUMMARY_COLUMNS)
    .order("is_premium", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(Math.min(filter.limit ?? 24, 100));

  if (filter.status) query = query.eq("status", filter.status);
  if (filter.sport) query = query.eq("sport", filter.sport);

  const { data, error } = await query;

  if (error) {
    console.error("No se pudo listar torneos públicos:", error.message);
    return [];
  }

  return (data ?? []) as PublicTournamentSummary[];
}

/** Ids and timestamps for the sitemap. */
export async function listSitemapTournaments(): Promise<
  Array<{ id: string; published_at: string | null; finished_at: string | null }>
> {
  "use cache";
  cacheLife("hours");
  cacheTag(PUBLIC_TOURNAMENTS_TAG);

  const supabase = getPublicSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("public_tournaments")
    .select("id, published_at, finished_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5000);

  if (error) {
    console.error("No se pudo generar el sitemap:", error.message);
    return [];
  }

  return data ?? [];
}

import "server-only";
import { getStoredToken, getStoredTokens, tokenMatches } from "@/lib/admin-access";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser, type SessionUser } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  isUuid,
  type Competitor,
  type MatchRow,
  type Tournament,
} from "@/lib/tournament/types";

const TOURNAMENT_COLUMNS =
  "id, name, format, sport, location, description, status, is_premium, is_listed, created_at, published_at, finished_at, owner_id, admin_token_hash";

type TournamentWithAccess = Tournament & {
  owner_id: string | null;
  admin_token_hash: string | null;
};

export type ManageAccess = {
  /** Token from this device's cookie, when it is valid. */
  token: string | null;
  user: SessionUser | null;
  isOwner: boolean;
};

export type ManagedTournament = {
  tournament: Tournament & { is_claimed: boolean };
  competitors: Competitor[];
  matches: MatchRow[];
  access: ManageAccess;
  totalViews: number;
};

function strip(row: TournamentWithAccess): Tournament & { is_claimed: boolean } {
  const { owner_id, admin_token_hash: _hash, ...tournament } = row;
  return { ...tournament, is_claimed: owner_id !== null };
}

/** Resolves who may act on a tournament: device token or account owner. */
export async function resolveAccess(
  tournamentId: string,
): Promise<{ access: ManageAccess; row: TournamentWithAccess } | null> {
  if (!isSupabaseConfigured() || !isUuid(tournamentId)) return null;

  const supabase = createSupabaseAdminClient();
  const [{ data, error }, storedToken, user] = await Promise.all([
    supabase.from("tournaments").select(TOURNAMENT_COLUMNS).eq("id", tournamentId).maybeSingle(),
    getStoredToken(tournamentId),
    getSessionUser(),
  ]);

  if (error) throw error;
  if (!data) return null;

  const row = data as TournamentWithAccess;
  const token = tokenMatches(storedToken, row.admin_token_hash) ? storedToken : null;
  const isOwner = Boolean(user && row.owner_id === user.id);

  if (!token && !isOwner) return null;

  return { access: { token, user, isOwner }, row };
}

export async function getManagedTournament(id: string): Promise<ManagedTournament | null> {
  const resolved = await resolveAccess(id);
  if (!resolved) return null;

  const supabase = createSupabaseAdminClient();
  const [competitorsResult, matchesResult, viewsResult] = await Promise.all([
    supabase.from("competitors").select("id, name").eq("tournament_id", id).order("name"),
    supabase
      .from("matches")
      .select(
        "id, round_number, position, competitor1_id, competitor2_id, status, score1, score2, winner_id",
      )
      .eq("tournament_id", id)
      .order("round_number")
      .order("position"),
    supabase.from("tournament_daily_views").select("views").eq("tournament_id", id),
  ]);

  if (competitorsResult.error) throw competitorsResult.error;
  if (matchesResult.error) throw matchesResult.error;

  return {
    tournament: strip(resolved.row),
    competitors: (competitorsResult.data ?? []) as Competitor[],
    matches: (matchesResult.data ?? []) as MatchRow[],
    access: resolved.access,
    totalViews: (viewsResult.data ?? []).reduce((sum, row) => sum + (row.views as number), 0),
  };
}

export type MyTournament = Tournament & {
  is_claimed: boolean;
  participant_count: number;
  source: "device" | "account";
};

/** Tournaments managed from this device plus those linked to the account. */
export async function listMyTournaments(): Promise<{
  tournaments: MyTournament[];
  user: SessionUser | null;
}> {
  const [tokens, user] = await Promise.all([getStoredTokens(), getSessionUser()]);
  if (!isSupabaseConfigured()) return { tournaments: [], user };

  const ids = [...tokens.keys()];
  if (ids.length === 0 && !user) return { tournaments: [], user };

  const supabase = createSupabaseAdminClient();
  const filters = [
    ids.length > 0 ? `id.in.(${ids.join(",")})` : null,
    user ? `owner_id.eq.${user.id}` : null,
  ].filter(Boolean);

  const { data, error } = await supabase
    .from("tournaments")
    .select(`${TOURNAMENT_COLUMNS}, competitors(count)`)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const tournaments = ((data ?? []) as Array<TournamentWithAccess & { competitors: { count: number }[] }>)
    .filter(
      (row) =>
        (user && row.owner_id === user.id) || tokenMatches(tokens.get(row.id), row.admin_token_hash),
    )
    .map(({ competitors, ...row }) => ({
      ...strip(row),
      participant_count: competitors[0]?.count ?? 0,
      source: user && row.owner_id === user.id ? ("account" as const) : ("device" as const),
    }));

  return { tournaments, user };
}

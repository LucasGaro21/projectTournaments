"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { forgetToken, generateAdminToken, rememberToken } from "@/lib/admin-access";
import { PUBLIC_TOURNAMENTS_TAG, tournamentTag } from "@/lib/data/tags";
import { resolveAccess } from "@/lib/data/manage";
import { isSupabaseConfigured } from "@/lib/env";
import { getClientIpHash } from "@/lib/request-ip";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { describeDatabaseError } from "@/lib/tournament/errors";
import {
  findDuplicateNames,
  generateFixture,
  parseParticipants,
  shuffle,
} from "@/lib/tournament/fixture";
import {
  isFormat,
  isSport,
  isUuid,
  MAX_DESCRIPTION_LENGTH,
  MAX_PARTICIPANT_NAME_LENGTH,
  MAX_PARTICIPANTS,
} from "@/lib/tournament/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type FormState = { error: string | null; saved?: boolean };

const NO_ACCESS = "No tenés permiso para administrar este torneo. Abrí tu enlace de administración.";
const NOT_CONFIGURED = "El servicio no está configurado todavía.";

function invalidate(tournamentId: string) {
  updateTag(tournamentTag(tournamentId));
  updateTag(PUBLIC_TOURNAMENTS_TAG);
  refresh();
}

/** Runs a management function as the device token holder or the owner. */
async function manage(
  tournamentId: string,
  fn: string,
  args: Record<string, unknown> = {},
): Promise<ActionResult> {
  if (!isUuid(tournamentId)) return { ok: false, error: "Torneo inválido." };
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED };

  const resolved = await resolveAccess(tournamentId);
  if (!resolved) return { ok: false, error: NO_ACCESS };

  const { error } = await createSupabaseAdminClient().rpc(fn, {
    ...args,
    p_actor: resolved.access.isOwner ? resolved.access.user!.id : null,
    p_token: resolved.access.token,
  });

  if (error) {
    console.error(`${fn} failed:`, error.message);
    return { ok: false, error: describeDatabaseError(error) };
  }

  return { ok: true };
}

export async function createTournament(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  // Honeypot: real people never fill this hidden field.
  if (String(formData.get("website") ?? "") !== "") return { error: null };

  const name = String(formData.get("name") ?? "").trim();
  const format = formData.get("format");
  const sport = formData.get("sport");
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const randomize = formData.get("randomize") === "on";
  const participants = parseParticipants(String(formData.get("participants") ?? ""));

  if (name.length < 3 || name.length > 120) {
    return { error: "El nombre debe tener entre 3 y 120 caracteres." };
  }
  if (!isFormat(format)) return { error: "Elegí un formato." };
  if (!isSport(sport)) return { error: "Elegí un deporte." };
  if (location.length > 120) return { error: "La sede puede tener hasta 120 caracteres." };
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `La descripción puede tener hasta ${MAX_DESCRIPTION_LENGTH} caracteres.` };
  }
  if (participants.length < 2) return { error: "Agregá al menos 2 participantes, uno por línea." };
  if (participants.length > MAX_PARTICIPANTS) {
    return { error: `El máximo es ${MAX_PARTICIPANTS} participantes.` };
  }

  const tooLong = participants.find((item) => item.length > MAX_PARTICIPANT_NAME_LENGTH);
  if (tooLong) {
    return { error: `"${tooLong.slice(0, 30)}…" supera los ${MAX_PARTICIPANT_NAME_LENGTH} caracteres.` };
  }

  const duplicates = findDuplicateNames(participants);
  if (duplicates.length > 0) return { error: `Hay participantes repetidos: ${duplicates.join(", ")}.` };
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };

  const [user, ipHash] = await Promise.all([getSessionUser(), getClientIpHash()]);
  const ordered = randomize ? shuffle(participants) : participants;
  const token = generateAdminToken();

  const { data: tournamentId, error } = await createSupabaseAdminClient().rpc("create_tournament", {
    p_name: name,
    p_format: format,
    p_sport: sport,
    p_location: location || null,
    p_description: description || null,
    p_participant_names: ordered,
    p_fixture: generateFixture(ordered, format),
    p_admin_token: token,
    p_owner: user?.id ?? null,
    p_creator_ip_hash: ipHash,
  });

  if (error || typeof tournamentId !== "string") {
    console.error("create_tournament failed:", error?.message);
    return { error: describeDatabaseError(error) };
  }

  await rememberToken(tournamentId, token);
  updateTag(PUBLIC_TOURNAMENTS_TAG);
  redirect(`/gestionar/${tournamentId}?nuevo=1`);
}

export async function recordResult(
  tournamentId: string,
  matchId: string,
  score1: number,
  score2: number,
): Promise<ActionResult> {
  if (!isUuid(matchId)) return { ok: false, error: "Partido inválido." };
  if (![score1, score2].every((score) => Number.isInteger(score) && score >= 0 && score <= 999)) {
    return { ok: false, error: describeDatabaseError({ message: "invalid_score" }) };
  }

  const result = await manage(tournamentId, "record_match_result", {
    p_match_id: matchId,
    p_score1: score1,
    p_score2: score2,
  });
  if (result.ok) invalidate(tournamentId);
  return result;
}

async function tournamentCommand(fn: string, tournamentId: string): Promise<ActionResult> {
  const result = await manage(tournamentId, fn, { p_tournament_id: tournamentId });
  if (result.ok) invalidate(tournamentId);
  return result;
}

export async function publishTournament(tournamentId: string) {
  return tournamentCommand("publish_tournament", tournamentId);
}

export async function finishTournament(tournamentId: string) {
  return tournamentCommand("finish_tournament", tournamentId);
}

export async function reopenTournament(tournamentId: string) {
  return tournamentCommand("reopen_tournament", tournamentId);
}

export async function claimTournament(tournamentId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: describeDatabaseError({ message: "auth_required" }) };
  return tournamentCommand("claim_tournament", tournamentId);
}

export async function updateTournamentDetails(
  tournamentId: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await manage(tournamentId, "update_tournament_details", {
    p_tournament_id: tournamentId,
    p_name: String(formData.get("name") ?? ""),
    p_location: String(formData.get("location") ?? ""),
    p_description: String(formData.get("description") ?? ""),
    p_is_listed: formData.get("is_listed") === "on",
  });

  if (!result.ok) return { error: result.error };
  invalidate(tournamentId);
  return { error: null, saved: true };
}

export async function deleteTournament(tournamentId: string): Promise<ActionResult> {
  const result = await manage(tournamentId, "delete_tournament", { p_tournament_id: tournamentId });
  if (!result.ok) return result;

  await forgetToken(tournamentId);
  updateTag(tournamentTag(tournamentId));
  updateTag(PUBLIC_TOURNAMENTS_TAG);
  redirect("/mis-torneos");
}

/** Removes a tournament from this device's list without deleting it. */
export async function forgetTournament(tournamentId: string) {
  if (isUuid(tournamentId)) await forgetToken(tournamentId);
  refresh();
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/mis-torneos");
}

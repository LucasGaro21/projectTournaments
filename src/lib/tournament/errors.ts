const MESSAGES: Record<string, string> = {
  auth_required: "Necesitás ingresar con tu cuenta para hacer esto.",
  rate_limited: "Creaste muchos torneos hoy. Probá de nuevo mañana.",
  invalid_admin_token: "No se pudo generar el acceso de administración.",
  invalid_description: "La descripción puede tener hasta 600 caracteres.",
  already_claimed: "Este torneo ya está vinculado a otra cuenta.",
  tournament_not_finished: "El torneo no está finalizado.",
  invalid_name: "El nombre del torneo debe tener entre 3 y 120 caracteres.",
  invalid_format: "El formato elegido no es válido.",
  invalid_sport: "El deporte elegido no es válido.",
  invalid_location: "La ubicación puede tener hasta 120 caracteres.",
  invalid_participant_count: "El torneo necesita entre 2 y 128 participantes.",
  invalid_participant_name: "Cada participante debe tener entre 1 y 60 caracteres.",
  duplicate_participants: "Hay participantes repetidos en la lista.",
  invalid_fixture: "No se pudo generar un fixture válido.",
  tournament_not_found: "No tenés permiso para administrar este torneo. Abrí tu enlace de administración.",
  tournament_already_published: "El torneo ya está publicado.",
  tournament_incomplete: "El torneo necesita participantes y partidos para publicarse.",
  tournament_not_active: "El torneo no está en juego.",
  matches_pending: "Todavía hay partidos sin resultado.",
  match_not_found: "No encontramos ese partido.",
  match_not_ready: "Este partido todavía no tiene a sus dos rivales definidos.",
  invalid_score: "Los resultados deben ser números enteros entre 0 y 999.",
  draw_not_allowed: "En eliminación directa no puede haber empate. Cargá el desempate.",
  next_match_already_played:
    "No se puede cambiar el ganador: la siguiente ronda ya tiene resultado.",
};

const FALLBACK = "Algo salió mal. Intentá nuevamente.";

/** Maps a database error (raised with a snake_case code) to Spanish copy. */
export function describeDatabaseError(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

  return MESSAGES[message.trim()] ?? FALLBACK;
}

export const SPORTS = [
  "Fútbol",
  "Pádel",
  "Tenis",
  "Básquet",
  "Vóley",
  "Ping pong",
  "eSports",
  "Truco",
  "Ajedrez",
  "Otro",
] as const;

export type Sport = (typeof SPORTS)[number];

export const FORMATS = ["Americano", "Eliminatoria"] as const;

export type TournamentFormat = (typeof FORMATS)[number];

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  Americano: "Liga · todos contra todos",
  Eliminatoria: "Eliminación directa",
};

export type TournamentStatus = "borrador" | "activo" | "finalizado";

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  borrador: "Borrador",
  activo: "En juego",
  finalizado: "Finalizado",
};

export type MatchStatus = "pendiente" | "finalizado" | "bye";

export const MAX_PARTICIPANTS = 128;
export const MAX_PARTICIPANT_NAME_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 600;

export type Tournament = {
  id: string;
  name: string;
  format: TournamentFormat;
  sport: Sport;
  location: string | null;
  description: string | null;
  status: TournamentStatus;
  is_premium: boolean;
  is_listed: boolean;
  created_at: string;
  published_at: string | null;
  finished_at: string | null;
};

export type PublicTournamentSummary = Tournament & {
  participant_count: number;
  played_count: number;
  match_count: number;
  view_count: number;
};

export type Competitor = {
  id: string;
  name: string;
};

export type MatchRow = {
  id: string;
  round_number: number;
  position: number;
  competitor1_id: string | null;
  competitor2_id: string | null;
  status: MatchStatus;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
};

export function isSport(value: unknown): value is Sport {
  return SPORTS.includes(value as Sport);
}

export function isFormat(value: unknown): value is TournamentFormat {
  return FORMATS.includes(value as TournamentFormat);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

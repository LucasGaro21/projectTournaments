export const PUBLIC_TOURNAMENTS_TAG = "public-tournaments";

export function tournamentTag(id: string): string {
  return `tournament:${id}`;
}

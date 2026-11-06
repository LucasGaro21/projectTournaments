import type { MetadataRoute } from "next";
import { listSitemapTournaments } from "@/lib/data/public";
import { getSiteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const tournaments = await listSitemapTournaments();

  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/torneos`, changeFrequency: "hourly", priority: 0.8 },
    ...tournaments.map((tournament) => ({
      url: `${site}/torneo/${tournament.id}`,
      lastModified: tournament.finished_at ?? tournament.published_at ?? undefined,
      changeFrequency: tournament.finished_at ? ("monthly" as const) : ("hourly" as const),
      priority: tournament.finished_at ? 0.4 : 0.7,
    })),
  ];
}

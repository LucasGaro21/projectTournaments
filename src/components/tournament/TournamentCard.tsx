import { Crown, Eye, MapPin, Users } from "lucide-react";
import Link from "next/link";
import SportArt from "@/components/brand/SportArt";
import {
  FORMAT_LABELS,
  STATUS_LABELS,
  type PublicTournamentSummary,
} from "@/lib/tournament/types";

export default function TournamentCard({ tournament }: { tournament: PublicTournamentSummary }) {
  const percent =
    tournament.match_count === 0
      ? 0
      : Math.round((tournament.played_count / tournament.match_count) * 100);

  return (
    <Link
      href={`/torneo/${tournament.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-28">
        <SportArt sport={tournament.sport} className="absolute inset-0 size-full" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[11px] font-semibold">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-slate-800 backdrop-blur">
            {tournament.sport}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur ${
              tournament.status === "activo" ? "bg-emerald-500 text-white" : "bg-white/90 text-slate-700"
            }`}
          >
            {tournament.status === "activo" ? (
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
            ) : null}
            {STATUS_LABELS[tournament.status]}
          </span>
        </div>
        {tournament.is_premium ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950">
            <Crown className="size-3" aria-hidden="true" />
            Destacado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand">
          {tournament.name}
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">{FORMAT_LABELS[tournament.format]}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" />
            {tournament.participant_count}
          </span>
          {tournament.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {tournament.location}
            </span>
          ) : null}
          {tournament.view_count > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" aria-hidden="true" />
              {tournament.view_count.toLocaleString("es-AR")}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex justify-between text-[11px] font-medium text-slate-500">
            <span>
              {tournament.played_count}/{tournament.match_count} partidos
            </span>
            <span>{percent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

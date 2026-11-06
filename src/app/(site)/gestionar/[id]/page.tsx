import { ArrowLeft, Eye, ExternalLink, KeyRound, PartyPopper, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SportArt from "@/components/brand/SportArt";
import Bracket from "@/components/tournament/Bracket";
import ShareButtons from "@/components/tournament/ShareButtons";
import StandingsTable from "@/components/tournament/StandingsTable";
import { getManagedTournament } from "@/lib/data/manage";
import { getSiteUrl } from "@/lib/env";
import { getPremiumPrice } from "@/lib/premium";
import { computeProgress, computeStandings } from "@/lib/tournament/standings";
import { FORMAT_LABELS, STATUS_LABELS } from "@/lib/tournament/types";
import {
  AccountCard,
  AdminLinkCard,
  DeleteButton,
  DetailsForm,
  PremiumCard,
  StatusCard,
} from "./ManageSidebar";
import ResultsManager from "./ResultsManager";

export const metadata: Metadata = {
  title: "Administrar torneo",
  robots: { index: false, follow: false },
};

const PAYMENT_MESSAGES: Record<string, { tone: string; text: string }> = {
  success: {
    tone: "border-blue-200 bg-blue-50 text-blue-800",
    text: "¡Gracias! Premium se activa apenas Mercado Pago confirme el pago (suele ser inmediato).",
  },
  pending: {
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    text: "El pago está pendiente de acreditación. Premium se activa solo cuando se confirme.",
  },
  failure: {
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    text: "El pago no se completó. Podés intentarlo de nuevo cuando quieras.",
  },
};

export default function ManagePage(props: PageProps<"/gestionar/[id]">) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/mis-torneos"
        className="no-print inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mis torneos
      </Link>
      <Suspense fallback={<div className="mt-6 h-[600px] animate-pulse rounded-3xl bg-slate-200/60" />}>
        <Manage {...props} />
      </Suspense>
    </main>
  );
}

async function Manage({ params, searchParams }: PageProps<"/gestionar/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getManagedTournament(id);

  if (!data) return <NoAccess badLink={query.error === "enlace"} />;

  const { tournament, competitors, matches, access, totalViews } = data;
  const site = getSiteUrl();
  const publicUrl = `${site}/torneo/${tournament.id}`;
  const adminUrl = access.token ? `${site}/acceso/${tournament.id}?clave=${access.token}` : null;
  const progress = computeProgress(matches);
  const names = new Map(competitors.map((competitor) => [competitor.id, competitor.name]));
  const isNew = query.nuevo === "1";
  const payment = typeof query.pago === "string" ? PAYMENT_MESSAGES[query.pago] : undefined;

  return (
    <>
      <header className="relative mt-4 overflow-hidden rounded-3xl text-white shadow-sm">
        <SportArt sport={tournament.sport} className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{tournament.sport}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                {FORMAT_LABELS[tournament.format]}
              </span>
              <span className="rounded-full bg-emerald-500 px-2.5 py-1">{STATUS_LABELS[tournament.status]}</span>
            </div>
            <h1 className="mt-3 truncate text-3xl font-bold tracking-tight sm:text-4xl">{tournament.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" aria-hidden="true" /> {competitors.length} participantes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="size-4" aria-hidden="true" /> {progress.played}/{progress.total} jugados
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" aria-hidden="true" /> {totalViews.toLocaleString("es-AR")} visitas
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={`/torneo/${tournament.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Ver página pública
            </Link>
          </div>
        </div>
      </header>

      {isNew ? (
        <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="flex items-center gap-2 text-lg font-bold text-emerald-900">
            <PartyPopper className="size-5" aria-hidden="true" />
            ¡Tu torneo está listo!
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            1) Guardá tu enlace de administración (abajo a la derecha). 2) Compartí la página pública
            con los jugadores. 3) Cargá los resultados a medida que se juegan.
          </p>
          <ShareButtons
            url={publicUrl}
            title={tournament.name}
            message={`🏆 ${tournament.name}\nSeguí el fixture, los resultados y la tabla en vivo acá: ${publicUrl}`}
            className="mt-4"
          />
        </section>
      ) : null}

      {payment ? (
        <p role="status" className={`mt-6 rounded-xl border px-4 py-3 text-sm ${payment.tone}`}>
          {payment.text}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <ResultsManager
            tournamentId={tournament.id}
            format={tournament.format}
            canEdit={tournament.status === "activo"}
            competitors={competitors}
            matches={matches}
          />
          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              {tournament.format === "Eliminatoria" ? "Llave" : "Tabla de posiciones"}
            </h2>
            {tournament.format === "Eliminatoria" ? (
              <Bracket matches={matches} names={names} />
            ) : (
              <StandingsTable rows={computeStandings(competitors, matches)} compact />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {adminUrl ? <AdminLinkCard adminUrl={adminUrl} highlight={isNew} /> : null}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-slate-900">Enlace para jugadores</p>
            <p className="mt-1 text-sm text-slate-600">Mandalo al grupo: ven todo en vivo.</p>
            <div className="mt-3 truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
              {publicUrl}
            </div>
            <ShareButtons url={publicUrl} title={tournament.name} className="mt-3" />
          </section>
          <StatusCard
            tournamentId={tournament.id}
            status={tournament.status}
            pendingMatches={progress.total - progress.played}
          />
          <PremiumCard
            tournamentId={tournament.id}
            isPremium={tournament.is_premium}
            isSignedIn={Boolean(access.user)}
            price={getPremiumPrice()}
          />
          <AccountCard
            tournamentId={tournament.id}
            isClaimed={tournament.is_claimed}
            isOwner={access.isOwner}
            userEmail={access.user?.email ?? null}
          />
          <DetailsForm
            tournamentId={tournament.id}
            name={tournament.name}
            location={tournament.location}
            description={tournament.description}
            isListed={tournament.is_listed}
          />
          <DeleteButton tournamentId={tournament.id} />
        </aside>
      </div>
    </>
  );
}

function NoAccess({ badLink }: { badLink: boolean }) {
  return (
    <section className="mx-auto mt-10 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <KeyRound className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-slate-900">
        {badLink ? "El enlace de administración no es válido" : "No tenés acceso a este torneo"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Para administrarlo abrí el <b>enlace de administración</b> que recibiste al crearlo, o
        ingresá con la cuenta a la que está vinculado.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/login"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
        >
          Ingresar con mi cuenta
        </Link>
        <Link
          href="/crear"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Crear un torneo nuevo
        </Link>
      </div>
    </section>
  );
}

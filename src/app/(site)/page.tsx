import {
  ArrowRight,
  BadgeCheck,
  ChartColumn,
  Check,
  ClipboardPaste,
  GitBranch,
  KeyRound,
  ListOrdered,
  MessageCircle,
  Smartphone,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";
import SportArt from "@/components/brand/SportArt";
import HeroMockup from "@/components/marketing/HeroMockup";
import TournamentCard from "@/components/tournament/TournamentCard";
import { listPublicTournaments } from "@/lib/data/public";
import type { Sport } from "@/lib/tournament/types";

const highlightedSports: Array<{ sport: Sport; label: string }> = [
  { sport: "Pádel", label: "Pádel" },
  { sport: "Fútbol", label: "Fútbol 5" },
  { sport: "Tenis", label: "Tenis" },
  { sport: "Básquet", label: "Básquet" },
  { sport: "eSports", label: "FIFA / eSports" },
  { sport: "Truco", label: "Truco" },
];

const steps = [
  {
    icon: ClipboardPaste,
    title: "Pegá la lista",
    text: "Copiá los nombres del grupo de WhatsApp. Quitamos numeraciones y repetidos.",
  },
  {
    icon: Zap,
    title: "Elegí el formato",
    text: "Liga todos contra todos o eliminación directa con cabezas de serie. El fixture sale solo.",
  },
  {
    icon: MessageCircle,
    title: "Compartí y cargá resultados",
    text: "Mandá el link al grupo. Cada resultado que cargás se ve al instante en todos los celulares.",
  },
];

const features = [
  { icon: KeyRound, title: "Sin registro", text: "Creás el torneo y recibís un enlace privado para administrarlo." },
  { icon: ListOrdered, title: "Tabla automática", text: "Puntos, diferencia y desempates calculados en cada resultado." },
  { icon: GitBranch, title: "Llaves que avanzan solas", text: "Byes, cuartos, semis y final sin tocar nada." },
  { icon: Smartphone, title: "Pensado para el celular", text: "Cargás un resultado en dos toques desde la cancha." },
  { icon: Star, title: "Seguí a tu equipo", text: "Cada jugador ve su próximo partido y su posición." },
  { icon: ChartColumn, title: "Visitas del torneo", text: "Mirá cuánta gente sigue tu torneo: ideal para sponsors." },
];

const faqs = [
  {
    q: "¿Es gratis de verdad?",
    a: "Sí. Crear torneos, cargar resultados y compartirlos es gratis y sin límite. Las páginas públicas muestran publicidad, y así se sostiene el servicio.",
  },
  {
    q: "¿Necesito crear una cuenta?",
    a: "No. Al crear el torneo recibís un enlace de administración: guardalo y con él gestionás desde cualquier dispositivo. La cuenta solo hace falta para Premium.",
  },
  {
    q: "¿Qué pasa si pierdo el enlace de administración?",
    a: "En el dispositivo donde creaste el torneo queda guardado en “Mis torneos”. Para no depender de un solo celular, vinculá el torneo a una cuenta gratuita.",
  },
  {
    q: "¿Los jugadores tienen que instalar algo?",
    a: "No. Abren el enlace desde WhatsApp y ven la tabla, los partidos y su próximo rival.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="size-1.5 rounded-full bg-lime" />
              Gratis · Sin registro · Desde el celular
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Armá tu torneo y compartí la tabla <span className="text-lime">en vivo</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Pegá los participantes, elegí el formato y listo: fixture, resultados y posiciones
              para que todo el grupo los siga desde WhatsApp.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/crear"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3.5 text-base font-bold text-ink shadow-[0_10px_40px_-10px_rgba(163,230,53,0.6)] transition hover:brightness-95"
              >
                Crear torneo gratis
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              <Link
                href="/torneos"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Ver torneos en juego
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {["Hasta 128 participantes", "Liga o eliminación", "Sin instalar nada"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-lime" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroMockup />
        </div>
      </section>

      {/* Sports */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Para cualquier deporte o juego
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {highlightedSports.map(({ sport, label }) => (
            <Link
              key={sport}
              href={`/torneos?deporte=${encodeURIComponent(sport)}`}
              className="group relative h-28 overflow-hidden rounded-2xl shadow-sm"
            >
              <SportArt
                sport={sport}
                className="absolute inset-0 size-full transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 text-sm font-bold text-white">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="como-funciona" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Cómo funciona</p>
            <h2 id="como-funciona" className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              De la lista de WhatsApp al fixture en 30 segundos
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="absolute right-5 top-4 text-5xl font-black text-slate-200">
                  {index + 1}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-ink text-lime">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link
              href="/crear"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Probarlo ahora
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Todo lo que necesitás para organizar, nada que te complique
        </h2>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LiveTournaments />

      {/* Pricing */}
      <section aria-labelledby="planes" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 id="planes" className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Gratis para siempre. Premium si lo querés impecable.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <PlanCard
              name="Gratis"
              price="$0"
              note="Sin registro, sin límite de torneos"
              items={[
                "Liga y eliminación directa",
                "Resultados y tabla en vivo",
                "Enlace para compartir por WhatsApp",
                "Incluye publicidad en la página pública",
              ]}
              cta={{ href: "/crear", label: "Crear torneo" }}
            />
            <PlanCard
              featured
              name="Premium"
              price="Pago único"
              note="Por torneo, con Mercado Pago"
              items={[
                "Sin publicidad para tus jugadores",
                "Planilla imprimible / PDF",
                "Destacado primero en Explorar",
                "Torneo vinculado a tu cuenta",
              ]}
              cta={{ href: "/premium", label: "Ver Premium" }}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                {q}
                <span className="text-xl text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white sm:px-12">
          <div className="bg-grid absolute inset-0 opacity-60" />
          <div className="relative">
            <BadgeCheck className="mx-auto size-10 text-lime" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Tu próximo torneo, listo hoy</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-300">
              Sin cuentas, sin planillas de Excel, sin fotos borrosas del fixture.
            </p>
            <Link
              href="/crear"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3.5 font-bold text-ink transition hover:brightness-95"
            >
              Crear torneo gratis
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PlanCard({
  name,
  price,
  note,
  items,
  cta,
  featured = false,
}: {
  name: string;
  price: string;
  note: string;
  items: string[];
  cta: { href: string; label: string };
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-3xl p-8 ${
        featured ? "bg-ink text-white shadow-xl" : "border border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`text-sm font-semibold uppercase tracking-wider ${featured ? "text-lime" : "text-brand"}`}>
        {name}
      </p>
      <p className="mt-3 text-4xl font-bold">{price}</p>
      <p className={`mt-1 text-sm ${featured ? "text-slate-400" : "text-slate-500"}`}>{note}</p>
      <ul className="mt-8 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className={`mt-0.5 size-4 shrink-0 ${featured ? "text-lime" : "text-brand"}`} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
          featured ? "bg-lime text-ink hover:brightness-95" : "bg-ink text-white hover:bg-ink-soft"
        }`}
      >
        {cta.label}
      </Link>
    </div>
  );
}

async function LiveTournaments() {
  const tournaments = await listPublicTournaments({ status: "activo", limit: 6 });

  return (
    <section aria-labelledby="en-juego" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {tournaments.length > 0 ? (
        <>
          <div className="flex items-end justify-between gap-4">
            <h2 id="en-juego" className="text-3xl font-bold tracking-tight text-slate-900">
              Torneos en juego ahora
            </h2>
            <Link href="/torneos" className="text-sm font-semibold text-brand hover:text-brand-hover">
              Ver todos →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </>
      ) : null}
      <AdSlot placement="inline" className="mt-12" />
    </section>
  );
}

"use client";

import { GitBranch, ListOrdered, LoaderCircle, Shuffle } from "lucide-react";
import { useActionState, useState } from "react";
import SportArt from "@/components/brand/SportArt";
import {
  findDuplicateNames,
  knockoutRoundCount,
  nextPowerOfTwo,
  parseParticipants,
} from "@/lib/tournament/fixture";
import {
  FORMAT_LABELS,
  isSport,
  MAX_DESCRIPTION_LENGTH,
  MAX_PARTICIPANTS,
  SPORTS,
  type Sport,
  type TournamentFormat,
} from "@/lib/tournament/types";
import { createTournament, type FormState } from "../actions";

const input =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10";
const label = "mb-1.5 block text-sm font-semibold text-slate-800";

const formats: Array<{ value: TournamentFormat; icon: typeof ListOrdered; hint: string }> = [
  {
    value: "Americano",
    icon: ListOrdered,
    hint: "Todos contra todos. Gana quien suma más puntos (3 victoria, 1 empate).",
  },
  {
    value: "Eliminatoria",
    icon: GitBranch,
    hint: "Llave con cabezas de serie. El que gana avanza solo de ronda.",
  },
];

function summarize(count: number, format: TournamentFormat): string | null {
  if (count < 2) return null;
  if (format === "Americano") {
    const matches = (count * (count - 1)) / 2;
    const rounds = count % 2 === 0 ? count - 1 : count;
    return `${matches} partidos en ${rounds} fechas${count % 2 ? " · uno descansa por fecha" : ""}`;
  }
  const byes = nextPowerOfTwo(count) - count;
  return `${count - 1} partidos en ${knockoutRoundCount(count)} rondas${
    byes ? ` · ${byes} pasan directo a 2ª ronda` : ""
  }`;
}

export default function CreateTournamentForm() {
  const [state, action, isPending] = useActionState<FormState, FormData>(createTournament, {
    error: null,
  });
  // Controlled fields so a validation error does not wipe what was typed.
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Sport>("Pádel");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("Americano");
  const [participantsText, setParticipantsText] = useState("");
  const [randomize, setRandomize] = useState(false);

  const participants = parseParticipants(participantsText);
  const duplicates = findDuplicateNames(participants);
  const summary = summarize(participants.length, format);

  return (
    <form action={action} className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <Section number={1} title="Datos del torneo">
          <div>
            <label htmlFor="name" className={label}>Nombre</label>
            <input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Americano de pádel — Club Social"
              className={input}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sport" className={label}>Deporte</label>
              <select
                id="sport"
                name="sport"
                value={sport}
                onChange={(event) => isSport(event.target.value) && setSport(event.target.value)}
                className={input}
              >
                {SPORTS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className={label}>
                Ciudad o sede <span className="font-normal text-slate-400">· opcional</span>
              </label>
              <input
                id="location"
                name="location"
                maxLength={120}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ej. Rosario"
                className={input}
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className={label}>
              Reglas o info para jugadores <span className="font-normal text-slate-400">· opcional</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Partidos a 1 set de 6 games. Sábados desde las 10 h."
              className={`${input} resize-y`}
            />
          </div>
        </Section>

        <Section number={2} title="Formato">
          <div className="grid gap-3 sm:grid-cols-2">
            {formats.map(({ value, icon: Icon, hint }) => (
              <label
                key={value}
                className={`cursor-pointer rounded-xl border-2 bg-white p-4 transition ${
                  format === value ? "border-brand ring-4 ring-brand/10" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-semibold text-slate-900">
                  <Icon className="size-4 text-brand" aria-hidden="true" />
                  {FORMAT_LABELS[value]}
                </span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">{hint}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section number={3} title="Participantes">
          <div>
            <label htmlFor="participants" className={label}>
              Pegalos desde WhatsApp, uno por línea
            </label>
            <textarea
              id="participants"
              name="participants"
              rows={10}
              required
              value={participantsText}
              onChange={(event) => setParticipantsText(event.target.value)}
              placeholder={"1. Gómez / Ruiz\n2. Las Panteras\n3. Paz / Lombardi\n4. Los del Fondo"}
              className={`${input} resize-y font-mono`}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Quitamos números y viñetas. Pueden ser personas, parejas o equipos. Máximo {MAX_PARTICIPANTS}.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              name="randomize"
              checked={randomize}
              onChange={(event) => setRandomize(event.target.checked)}
              className="mt-0.5 size-4 accent-emerald-600"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Shuffle className="size-4" aria-hidden="true" /> Sortear el orden
              </span>
              <span className="block text-xs text-slate-500">
                Si no lo marcás, el orden de la lista se usa como ranking (cabezas de serie).
              </span>
            </span>
          </label>
        </Section>

        {/* Honeypot for bots: hidden from people and assistive tech. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Sitio web
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-28">
            <SportArt sport={sport} className="absolute inset-0 size-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-3 left-4 right-4 truncate font-bold text-white">
              {name || "Tu torneo"}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vista previa</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {participants.length}
              <span className="ml-2 text-sm font-medium text-slate-500">participantes</span>
            </p>
            <p className="mt-1 text-sm text-slate-600" aria-live="polite">
              {summary ?? "Agregá al menos 2 participantes."}
            </p>
            {duplicates.length > 0 ? (
              <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Repetidos: {duplicates.join(", ")}
              </p>
            ) : null}

            {state.error ? (
              <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isPending || participants.length < 2 || duplicates.length > 0}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}
              {isPending ? "Creando…" : "Crear torneo y fixture"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Al crear aceptás los <a href="/terminos" className="underline">términos</a>.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs text-lime">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

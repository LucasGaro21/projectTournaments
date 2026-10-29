"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ClipboardList, LoaderCircle, Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  generateAmericanoFixture,
  parseParticipants,
} from "@/lib/matchmaking";

export default function CreateTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState("Americano");
  const [participants, setParticipants] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const tournamentName = name.trim();
    const participantNames = parseParticipants(participants);
    const normalizedNames = participantNames.map((participantName) =>
      participantName.toLocaleLowerCase(),
    );

    if (tournamentName.length < 3) {
      setError("El nombre del torneo debe tener al menos 3 caracteres.");
      return;
    }

    if (participantNames.length < 2) {
      setError("Agrega al menos 2 participantes para generar el fixture.");
      return;
    }

    if (new Set(normalizedNames).size !== participantNames.length) {
      setError("La lista no puede contener participantes repetidos.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("No hay una sesión administrativa activa.");
      }

      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({
          name: tournamentName,
          format,
          status: "borrador",
          owner_id: user.id,
        })
        .select("id")
        .single();

      if (tournamentError) {
        throw tournamentError;
      }

      const { data: competitors, error: competitorsError } = await supabase
        .from("competitors")
        .insert(
          participantNames.map((participantName) => ({
            tournament_id: tournament.id,
            name: participantName,
          })),
        )
        .select();

      if (competitorsError) {
        throw competitorsError;
      }

      if (!competitors || competitors.length !== participantNames.length) {
        throw new Error("No se pudieron crear todos los participantes.");
      }

      const fixture = generateAmericanoFixture(competitors, tournament.id);

      if (fixture.length === 0) {
        throw new Error("No se pudo generar ningún partido.");
      }

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(fixture);

      if (matchesError) {
        throw matchesError;
      }

      router.push("/");
    } catch (submissionError) {
      console.error("Error al generar el fixture:", submissionError);
      setError("No se pudo generar el fixture. Inténtalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al panel
      </Link>

      <div className="mt-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#39ff14]">
          Nuevo torneo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-100">
          Crear torneo
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          Configura los datos iniciales para generar tu fixture.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-2xl border border-[#39ff14]/20 bg-[#39ff14]/5 p-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#39ff14] text-zinc-950">
            <Sparkles className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-white">Tu torneo, tu ritmo.</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Cargá tus participantes y TorneosPro arma automáticamente todas las rondas.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Trophy, text: "Fixture automático Round Robin" },
              { icon: ClipboardList, text: "Resultados listos para gestionar" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <Icon className="size-4 text-[#39ff14]" aria-hidden="true" />
                {text}
              </div>
            ))}
          </div>
        </aside>

        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/20 sm:p-8"
        >
        <div>
          <label
            htmlFor="tournament-name"
            className="mb-2 block text-sm font-medium text-zinc-100"
          >
            Nombre del Torneo
          </label>
          <input
            id="tournament-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Torneo de verano"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14]"
          />
        </div>

        <div>
          <label
            htmlFor="tournament-format"
            className="mb-2 block text-sm font-medium text-zinc-100"
          >
            Formato
          </label>
          <select
            id="tournament-format"
            name="format"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14]"
          >
            <option value="Americano">Americano</option>
            <option value="Eliminatoria">Eliminatoria</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="participants"
            className="mb-2 block text-sm font-medium text-zinc-100"
          >
            Lista de Participantes (Pega desde WhatsApp, uno por línea)
          </label>
          <textarea
            id="participants"
            name="participants"
            rows={8}
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            placeholder={"Juan Pérez\nMaría García\nEquipo Los Tigres"}
            className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14]"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#39ff14] px-4 py-3 text-sm font-bold text-black transition-all hover:bg-[#6aff4d] hover:shadow-[0_0_24px_rgba(57,255,20,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting ? "Generando Fixture..." : "Generar Fixture"}
        </button>
        </form>
      </div>
    </div>
  );
}

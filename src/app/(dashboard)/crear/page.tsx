"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
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
    setIsSubmitting(true);

    try {
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({
          name: name.trim(),
          format,
          status: "borrador",
        })
        .select("id")
        .single();

      if (tournamentError) {
        throw tournamentError;
      }

      const participantNames = parseParticipants(participants);

      if (participantNames.length === 0) {
        throw new Error("Debes agregar al menos un participante.");
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

      const fixture = generateAmericanoFixture(competitors, tournament.id);
      const { error: matchesError } = await supabase
        .from("matches")
        .insert(fixture);

      if (matchesError) {
        throw matchesError;
      }

      router.push("/dashboard");
    } catch (submissionError) {
      console.error("Error al generar el fixture:", submissionError);
      setError("No se pudo generar el fixture. Inténtalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-8 py-10 lg:px-12">
      <Link
        href="/dashboard"
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
        <p className="mt-2 text-sm text-zinc-400">
          Configura los datos iniciales para generar tu fixture.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-10 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8"
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
  );
}

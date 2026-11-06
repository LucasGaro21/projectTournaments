"use client";

import { LoaderCircle, Pencil, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import MatchCard from "@/components/tournament/MatchCard";
import { knockoutRoundLabel } from "@/lib/tournament/fixture";
import type { Competitor, MatchRow, TournamentFormat } from "@/lib/tournament/types";
import { recordResult } from "../../actions";

export default function ResultsManager({
  tournamentId,
  format,
  canEdit,
  competitors,
  matches,
}: {
  tournamentId: string;
  format: TournamentFormat;
  canEdit: boolean;
  competitors: Competitor[];
  matches: MatchRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);
  const names = useMemo(
    () => new Map(competitors.map((competitor) => [competitor.id, competitor.name])),
    [competitors],
  );

  const rounds = useMemo(() => {
    const grouped = new Map<number, MatchRow[]>();
    for (const match of matches) {
      if (match.status === "bye") continue;
      if (onlyPending && match.status === "finalizado") continue;
      const list = grouped.get(match.round_number) ?? [];
      list.push(match);
      grouped.set(match.round_number, list);
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b);
  }, [matches, onlyPending]);

  const totalRounds = Math.max(0, ...matches.map((match) => match.round_number));
  const selected = matches.find((match) => match.id === selectedId) ?? null;

  return (
    <section aria-labelledby="resultados" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="resultados" className="text-lg font-bold text-slate-900">
          Partidos y resultados
        </h2>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {[
            [false, "Todos"],
            [true, "Pendientes"],
          ].map(([value, text]) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setOnlyPending(value as boolean)}
              className={`rounded-lg px-3 py-1.5 transition ${
                onlyPending === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {text as string}
            </button>
          ))}
        </div>
      </div>

      {!canEdit ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          El torneo está finalizado. Reabrilo para corregir resultados.
        </p>
      ) : null}

      <div className="mt-6 space-y-7">
        {rounds.length === 0 ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-700">
            ¡No quedan partidos pendientes!
          </p>
        ) : null}
        {rounds.map(([round, list]) => (
          <div key={round}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              {format === "Eliminatoria" ? knockoutRoundLabel(round, totalRounds) : `Fecha ${round}`}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((match) => {
                const ready = Boolean(match.competitor1_id && match.competitor2_id);
                const played = match.status === "finalizado";
                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    names={names}
                    action={
                      canEdit && ready ? (
                        <button
                          type="button"
                          onClick={() => setSelectedId(match.id)}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            played
                              ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                              : "bg-brand text-white hover:bg-brand-hover"
                          }`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          {played ? "Corregir" : "Cargar resultado"}
                        </button>
                      ) : null
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <ScoreDialog
          key={selected.id}
          tournamentId={tournamentId}
          match={selected}
          homeName={names.get(selected.competitor1_id ?? "") ?? "Local"}
          awayName={names.get(selected.competitor2_id ?? "") ?? "Visitante"}
          allowDraw={format === "Americano"}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}

function ScoreDialog({
  tournamentId,
  match,
  homeName,
  awayName,
  allowDraw,
  onClose,
}: {
  tournamentId: string;
  match: MatchRow;
  homeName: string;
  awayName: string;
  allowDraw: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [score1, setScore1] = useState(match.score1?.toString() ?? "");
  const [score2, setScore2] = useState(match.score2?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const valid = /^\d{1,3}$/.test(score1) && /^\d{1,3}$/.test(score2);
  const isDraw = valid && Number(score1) === Number(score2);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || (isDraw && !allowDraw)) return;
    setError(null);
    startTransition(async () => {
      const result = await recordResult(tournamentId, match.id, Number(score1), Number(score2));
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  const scoreInput =
    "w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-4 text-center text-4xl font-bold tabular-nums text-slate-900 outline-none focus:border-brand focus:bg-white";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={submit} className="p-6">
        <h2 className="text-xl font-bold text-slate-900">Cargar resultado</h2>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <label className="block">
            <span className="mb-2 block truncate text-center text-sm font-medium text-slate-600">{homeName}</span>
            <input
              inputMode="numeric"
              pattern="\d*"
              autoFocus
              maxLength={3}
              aria-label={`Resultado de ${homeName}`}
              value={score1}
              onChange={(event) => setScore1(event.target.value.replace(/\D/g, ""))}
              className={scoreInput}
            />
          </label>
          <span className="pb-5 text-2xl font-bold text-slate-300">:</span>
          <label className="block">
            <span className="mb-2 block truncate text-center text-sm font-medium text-slate-600">{awayName}</span>
            <input
              inputMode="numeric"
              pattern="\d*"
              maxLength={3}
              aria-label={`Resultado de ${awayName}`}
              value={score2}
              onChange={(event) => setScore2(event.target.value.replace(/\D/g, ""))}
              className={scoreInput}
            />
          </label>
        </div>

        {isDraw && !allowDraw ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            En eliminación directa tiene que haber un ganador. Sumá el desempate (penales, tie-break).
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || !valid || (isDraw && !allowDraw)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

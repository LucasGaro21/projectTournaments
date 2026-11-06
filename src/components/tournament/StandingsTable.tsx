import type { StandingRow } from "@/lib/tournament/standings";

export default function StandingsTable({
  rows,
  highlightId,
  compact = false,
}: {
  rows: StandingRow[];
  highlightId?: string | null;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay participantes.</p>;
  }

  const cell = compact ? "px-2 py-2.5" : "px-3 py-3";
  const anyPlayed = rows.some((row) => row.played > 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[540px] text-left text-sm tabular-nums">
        <caption className="sr-only">Tabla de posiciones</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className={`${cell} w-12 text-center font-semibold`}>#</th>
            <th scope="col" className={`${cell} font-semibold`}>Participante</th>
            <th scope="col" className={`${cell} text-center font-semibold`} title="Puntos">Pts</th>
            <th scope="col" className={`${cell} text-center font-semibold`} title="Partidos jugados">PJ</th>
            <th scope="col" className={`${cell} text-center font-semibold`} title="Ganados">G</th>
            <th scope="col" className={`${cell} text-center font-semibold`} title="Empatados">E</th>
            <th scope="col" className={`${cell} text-center font-semibold`} title="Perdidos">P</th>
            <th scope="col" className={`${cell} hidden text-center font-semibold sm:table-cell`} title="A favor">AF</th>
            <th scope="col" className={`${cell} hidden text-center font-semibold sm:table-cell`} title="En contra">EC</th>
            <th scope="col" className={`${cell} text-center font-semibold`} title="Diferencia">DIF</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const position = index + 1;
            const isMine = row.id === highlightId;
            const medal =
              anyPlayed && position <= 3
                ? ["bg-amber-400 text-amber-950", "bg-slate-300 text-slate-800", "bg-orange-300 text-orange-950"][index]
                : "bg-slate-100 text-slate-500";

            return (
              <tr key={row.id} className={isMine ? "bg-blue-50" : "hover:bg-slate-50/70"}>
                <td className={`${cell} text-center`}>
                  <span
                    className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${medal}`}
                  >
                    {position}
                  </span>
                </td>
                <th scope="row" className={`${cell} max-w-[15rem] truncate font-semibold text-slate-900`}>
                  {row.name}
                  {isMine ? (
                    <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Vos
                    </span>
                  ) : null}
                </th>
                <td className={`${cell} text-center text-base font-bold text-slate-900`}>{row.points}</td>
                <td className={`${cell} text-center text-slate-600`}>{row.played}</td>
                <td className={`${cell} text-center text-slate-600`}>{row.won}</td>
                <td className={`${cell} text-center text-slate-600`}>{row.drawn}</td>
                <td className={`${cell} text-center text-slate-600`}>{row.lost}</td>
                <td className={`${cell} hidden text-center text-slate-500 sm:table-cell`}>{row.scored}</td>
                <td className={`${cell} hidden text-center text-slate-500 sm:table-cell`}>{row.conceded}</td>
                <td
                  className={`${cell} text-center font-semibold ${
                    row.difference > 0 ? "text-emerald-600" : row.difference < 0 ? "text-rose-600" : "text-slate-500"
                  }`}
                >
                  {row.difference > 0 ? `+${row.difference}` : row.difference}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

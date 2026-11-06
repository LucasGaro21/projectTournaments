import { Crown, Star } from "lucide-react";
import SportArt from "@/components/brand/SportArt";

const standings = [
  { name: "Gómez / Ruiz", pts: 9, dif: "+8" },
  { name: "Las Panteras", pts: 7, dif: "+5" },
  { name: "Paz / Lombardi", pts: 6, dif: "+2" },
  { name: "Los del Fondo", pts: 4, dif: "-1" },
];

/** Product illustration: a phone with a live tournament plus a bracket card. */
export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="absolute -inset-8 rounded-full bg-lime/20 blur-3xl" />

      {/* Phone */}
      <div className="relative mx-auto w-[290px] rounded-[2.5rem] border-[10px] border-slate-800 bg-slate-800 shadow-2xl shadow-black/50">
        <div className="overflow-hidden rounded-[1.8rem] bg-slate-50">
          <div className="relative h-24">
            <SportArt sport="Pádel" className="absolute inset-0 size-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 text-white">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase">
                <span className="size-1 rounded-full bg-white" /> En juego
              </span>
              <p className="mt-1 text-sm font-bold leading-tight">Americano Club Social</p>
            </div>
          </div>
          <div className="space-y-2.5 p-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5">
              <p className="flex items-center gap-1 text-[9px] font-bold uppercase text-blue-700">
                <Star className="size-2.5 fill-blue-600" /> Tu próximo partido
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-800">
                Gómez / Ruiz <span className="text-slate-400">vs</span> Las Panteras
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                <span>Posiciones</span>
                <span>Pts · Dif</span>
              </div>
              {standings.map((row, index) => (
                <div
                  key={row.name}
                  className={`flex items-center justify-between border-t border-slate-100 px-2.5 py-1.5 text-[11px] ${
                    index === 0 ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span
                      className={`flex size-4 items-center justify-center rounded-full text-[8px] font-bold ${
                        ["bg-amber-400", "bg-slate-300", "bg-orange-300", "bg-slate-100"][index]
                      }`}
                    >
                      {index + 1}
                    </span>
                    {row.name}
                  </span>
                  <span className="font-mono text-slate-600">
                    <b className="text-slate-900">{row.pts}</b> · {row.dif}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["6", "4", "Gómez / Ruiz", "Paz / Lombardi"],
                ["3", "6", "Los del Fondo", "Las Panteras"],
              ].map(([a, b, home, away]) => (
                <div key={home} className="rounded-lg border border-slate-200 bg-white p-2 text-[9px]">
                  <div className="flex justify-between">
                    <span className="truncate">{home}</span>
                    <b>{a}</b>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="truncate">{away}</span>
                    <b className="text-slate-700">{b}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating bracket card */}
      <div className="absolute -bottom-6 -left-2 hidden w-52 rotate-[-4deg] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:block lg:-left-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-amber-300 text-xs">
          <div className="flex justify-between bg-emerald-50 px-2.5 py-1.5 font-semibold">
            <span className="flex items-center gap-1">
              <Crown className="size-3 text-amber-500" /> Los Tigres
            </span>
            <span>3</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 px-2.5 py-1.5 text-slate-500">
            <span>Deportivo Sur</span>
            <span>1</span>
          </div>
        </div>
      </div>

      {/* Floating share chip */}
      <div className="absolute -right-2 top-10 hidden rotate-[5deg] items-center gap-2 rounded-2xl bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-xl sm:flex lg:-right-6">
        Compartido en el grupo ✓
      </div>
    </div>
  );
}

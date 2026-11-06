import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import type { AdPlacement } from "./AdSlot";

/** Own promo shown in ad spaces until AdSense is active. */
export default function HouseAd({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  if (placement === "sidebar") {
    return (
      <aside
        aria-label="TorneosPro"
        className={`no-print overflow-hidden rounded-2xl bg-ink p-6 text-white ${className}`}
      >
        <LogoMark className="size-10" />
        <p className="mt-5 text-xl font-bold leading-tight">
          Organizá tu propio torneo en 30 segundos
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Fixture automático, resultados en vivo y tabla para compartir. Gratis y sin registro.
        </p>
        <Link
          href="/crear"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:brightness-95"
        >
          Crear torneo
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </aside>
    );
  }

  return (
    <aside
      aria-label="TorneosPro"
      className={`no-print overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10 shrink-0" />
          <div>
            <p className="font-semibold text-slate-900">¿Organizás torneos?</p>
            <p className="text-sm text-slate-500">
              Fixture, resultados y tabla en vivo. Gratis y sin registrarte.
            </p>
          </div>
        </div>
        <Link
          href="/crear"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Crear mi torneo
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

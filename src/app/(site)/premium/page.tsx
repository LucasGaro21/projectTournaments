import { Check, Crown, EyeOff, Printer, Sparkles, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPremiumPrice } from "@/lib/premium";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Sacá la publicidad de tu torneo, imprimí la planilla y destacalo en el listado. Pago único por torneo con Mercado Pago.",
  alternates: { canonical: "/premium" },
};

const rows: Array<[string, boolean, boolean]> = [
  ["Fixture automático (liga o eliminación)", true, true],
  ["Resultados y tabla en vivo", true, true],
  ["Página pública para compartir", true, true],
  ["Sin registro", true, false],
  ["Sin publicidad para los jugadores", false, true],
  ["Planilla imprimible / PDF", false, true],
  ["Destacado primero en Explorar", false, true],
];

const faqs = [
  {
    q: "¿Es una suscripción?",
    a: "No. Es un pago único por torneo. No se renueva ni se cobra de nuevo.",
  },
  {
    q: "¿Por qué necesito una cuenta para Premium?",
    a: "Para que el pago quede asociado a vos: podés ver el torneo desde cualquier dispositivo y tenemos a quién responder si hay un problema con el cobro.",
  },
  {
    q: "¿Cuándo se activa?",
    a: "En cuanto Mercado Pago confirma el pago, normalmente en segundos. Si pagaste en efectivo, cuando se acredita.",
  },
  {
    q: "¿Puedo pasar a Premium un torneo que ya empezó?",
    a: "Sí, en cualquier momento. Los resultados y la tabla no cambian.",
  },
];

export default function PremiumPage() {
  const price = getPremiumPrice();

  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-400 text-amber-950">
            <Crown className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Tu torneo, sin distracciones
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Ideal si tenés sponsors, cobrás inscripción o querés una imagen profesional.
          </p>
          <p className="mt-8 text-5xl font-bold">
            {price ? `$${price.toLocaleString("es-AR")}` : "Pago único"}
            <span className="ml-2 text-base font-normal text-slate-400">por torneo</span>
          </p>
          <Link
            href="/mis-torneos"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3.5 font-bold text-ink hover:brightness-95"
          >
            <Sparkles className="size-5" aria-hidden="true" />
            Elegir torneo para mejorar
          </Link>
          <p className="mt-3 text-sm text-slate-400">
            Desde la pantalla de administración de tu torneo → “Pasá a Premium”.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: EyeOff, title: "Sin publicidad", text: "Tus jugadores ven solo el torneo: tabla, partidos y llave." },
            { icon: Printer, title: "Planilla para imprimir", text: "Exportá a PDF desde el navegador para la cartelera del club." },
            { icon: Crown, title: "Destacado", text: "Aparece primero en Explorar torneos, con insignia." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="size-6 text-brand" aria-hidden="true" />
              <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Comparación</th>
                <th className="px-5 py-3 text-center font-semibold">Gratis</th>
                <th className="px-5 py-3 text-center font-semibold text-amber-700">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(([label, free, premium]) => (
                <tr key={label}>
                  <td className="px-5 py-3 text-slate-700">{label}</td>
                  {[free, premium].map((value, index) => (
                    <td key={index} className="px-5 py-3 text-center">
                      {value ? (
                        <Check className="mx-auto size-4 text-emerald-600" aria-label="Incluido" />
                      ) : (
                        <X className="mx-auto size-4 text-slate-300" aria-label="No incluido" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
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
    </main>
  );
}

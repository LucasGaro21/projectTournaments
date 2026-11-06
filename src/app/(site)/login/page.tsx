import { Crown, Smartphone, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div className="order-2 lg:order-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tu cuenta de organizador
        </h1>
        <p className="mt-3 text-slate-600">
          Es opcional: podés crear y administrar torneos sin cuenta. Te sirve para:
        </p>
        <ul className="mt-6 space-y-4">
          {[
            { icon: Crown, title: "Activar Premium", text: "Sin publicidad, planilla PDF y torneo destacado." },
            { icon: Smartphone, title: "Usar cualquier dispositivo", text: "Tus torneos te siguen sin depender del enlace." },
            { icon: UserRound, title: "Recuperar el acceso", text: "Si perdés el celular, tus torneos siguen en tu cuenta." },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">{title}</span>
                <span className="text-sm text-slate-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="order-1 lg:order-2">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-slate-200/60" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

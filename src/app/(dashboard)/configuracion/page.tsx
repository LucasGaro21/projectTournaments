"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? null);
      setIsLoading(false);
    }

    void loadAccount();
  }, [router]);

  async function handleSignOut() {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("No se pudo cerrar la sesión:", error);
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#39ff14]">
        <LoaderCircle className="size-7 animate-spin" aria-label="Cargando configuración" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#39ff14]">
          Cuenta
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Configuración
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          Administrá tu acceso y revisá la seguridad de tu panel.
        </p>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Cuenta administradora</h2>
              <p className="text-sm text-zinc-500">Correo asociado a tu sesión</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
            {email ?? "Correo no disponible"}
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            Cerrar sesión
          </button>
        </div>

        <div className="rounded-2xl border border-[#39ff14]/20 bg-[#39ff14]/5 p-6 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#39ff14]/15 text-[#39ff14]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-semibold text-white">Panel protegido</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Tu sesión es necesaria para administrar torneos y cargar resultados.
          </p>
          <div className="mt-6 space-y-3">
            {[
              "Autenticación activa",
              "Resultados gestionados por el administrador",
              "Datos preparados para políticas RLS",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#39ff14]" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-[#39ff14]/10 pt-5 text-xs text-zinc-500">
            <KeyRound className="size-3.5" aria-hidden="true" />
            Nunca compartas tus credenciales.
          </div>
        </div>
      </section>
    </main>
  );
}

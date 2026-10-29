"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Copy,
  CreditCard,
  Crown,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  is_premium: boolean;
  magic_link_token: string | null;
};

type TournamentPageProps = {
  params: {
    id: string;
  };
};

function createMagicLinkToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export default function TournamentAdminPage({
  params,
}: TournamentPageProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTournament() {
      try {
        const { data, error: fetchError } = await supabase
          .from("tournaments")
          .select("id, name, is_premium, magic_link_token")
          .eq("id", params.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setTournament(data as Tournament);
      } catch (fetchError) {
        console.error("Error al cargar el torneo:", fetchError);
        setError("No se pudo cargar el torneo.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchTournament();
  }, [params.id]);

  async function handleUpgrade() {
    if (!tournament) {
      return;
    }

    setError(null);
    setIsUpgrading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const magicLinkToken = createMagicLinkToken();
      const { data, error: updateError } = await supabase
        .from("tournaments")
        .update({
          is_premium: true,
          magic_link_token: magicLinkToken,
        })
        .eq("id", tournament.id)
        .select("id, name, is_premium, magic_link_token")
        .single();

      if (updateError) {
        throw updateError;
      }

      setTournament(data as Tournament);
    } catch (upgradeError) {
      console.error("Error al activar Premium:", upgradeError);
      setError("No se pudo activar Premium. Inténtalo nuevamente.");
    } finally {
      setIsUpgrading(false);
    }
  }

  async function handleCopyLink() {
    if (!tournament?.magic_link_token) {
      return;
    }

    const magicLink = `${window.location.origin}/torneo/${tournament.id}?token=${tournament.magic_link_token}`;
    await navigator.clipboard.writeText(magicLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-sm text-zinc-400">Cargando torneo...</p>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <p className="text-sm text-red-400">
          {error ?? "No se encontró el torneo."}
        </p>
      </main>
    );
  }

  const magicLink = tournament.magic_link_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/torneo/${tournament.id}?token=${tournament.magic_link_token}`
    : "";

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#39ff14]">
          Administración del torneo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {tournament.name}
        </h1>

        {error ? (
          <p role="alert" className="mt-6 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        {!tournament.is_premium ? (
          <section className="mt-10 rounded-2xl border border-[#39ff14] bg-zinc-900/50 p-6 shadow-[0_0_30px_rgba(57,255,20,0.08)] sm:p-8">
            <div className="flex items-start gap-4">
              <Crown className="mt-1 size-8 shrink-0 text-[#39ff14]" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-bold">
                  Desbloquea el Máximo Potencial
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Lleva la gestión de tu torneo al siguiente nivel.
                </p>
              </div>
            </div>

            <ul className="mt-8 space-y-4 text-sm text-zinc-200">
              {[
                "Sin anuncios para todos los participantes",
                "Exportación de planillas en PDF",
                "Delegación de carga a jugadores",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle
                    className="size-5 shrink-0 text-[#39ff14]"
                    aria-hidden="true"
                  />
                  {benefit}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void handleUpgrade()}
              disabled={isUpgrading}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#009EE3] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#008dcc] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <CreditCard className="size-5" aria-hidden="true" />
              {isUpgrading ? "Procesando pago..." : "Pagar con Mercado Pago"}
            </button>
          </section>
        ) : (
          <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Crown className="size-7 text-[#39ff14]" aria-hidden="true" />
              <h2 className="text-2xl font-bold">Torneo Premium Activo</h2>
            </div>

            <div className="mt-8">
              <label
                htmlFor="magic-link"
                className="flex items-center gap-2 text-sm font-medium text-zinc-200"
              >
                <LinkIcon className="size-4 text-[#39ff14]" aria-hidden="true" />
                Enlace Mágico para Compartir
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="magic-link"
                  type="text"
                  readOnly
                  value={magicLink}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[#39ff14] hover:text-[#39ff14]"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {isCopied ? "Copiado!" : "Copiar Link"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

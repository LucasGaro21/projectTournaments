"use client";

import {
  Check,
  Copy,
  Crown,
  CreditCard,
  Flag,
  KeyRound,
  Link2,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { TournamentStatus } from "@/lib/tournament/types";
import {
  claimTournament,
  deleteTournament,
  finishTournament,
  reopenTournament,
  updateTournamentDetails,
  type ActionResult,
  type FormState,
} from "../../actions";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export function StatusCard({
  tournamentId,
  status,
  pendingMatches,
}: {
  tournamentId: string;
  status: TournamentStatus;
  pendingMatches: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<ActionResult>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await action(tournamentId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section className={card}>
      {status === "finalizado" ? (
        <>
          <p className="font-semibold text-slate-900">Torneo finalizado 🏆</p>
          <p className="mt-1 text-sm text-slate-600">¿Hay que corregir algo? Reabrilo.</p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(reopenTournament)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Reabrir torneo
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold text-slate-900">
            {pendingMatches > 0 ? `Faltan ${pendingMatches} partidos` : "¡Todos los partidos jugados!"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {pendingMatches > 0
              ? "Cuando cargues todos, cerrá el torneo para mostrar al campeón."
              : "Cerrá el torneo para coronar al campeón."}
          </p>
          <button
            type="button"
            disabled={isPending || pendingMatches > 0}
            onClick={() => run(finishTournament, "¿Finalizar el torneo? Se mostrará el campeón.")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Flag className="size-4" />}
            Finalizar torneo
          </button>
        </>
      )}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}

export function AdminLinkCard({ adminUrl, highlight }: { adminUrl: string; highlight: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá tu enlace de administración:", adminUrl);
    }
  }

  return (
    <section
      className={`rounded-2xl p-5 shadow-sm ${
        highlight ? "border-2 border-amber-300 bg-amber-50" : "border border-slate-200 bg-white"
      }`}
    >
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <KeyRound className="size-4 text-amber-600" aria-hidden="true" />
        Tu enlace de administración
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Es la llave para cargar resultados desde cualquier dispositivo. <b>No lo compartas</b> con
        los jugadores. Guardalo, por ejemplo, mandándotelo por WhatsApp.
      </p>
      <div className="mt-3 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-500">
        {adminUrl}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🔑 Mi enlace para administrar el torneo (no compartir): ${adminUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
        >
          <MessageCircle className="size-4" />
          Enviármelo
        </a>
      </div>
    </section>
  );
}

export function AccountCard({
  tournamentId,
  isClaimed,
  isOwner,
  userEmail,
}: {
  tournamentId: string;
  isClaimed: boolean;
  isOwner: boolean;
  userEmail: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isOwner) {
    return (
      <section className={card}>
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserRound className="size-4 text-brand" aria-hidden="true" />
          Vinculado a {userEmail ?? "tu cuenta"}
        </p>
        <p className="mt-1 text-sm text-slate-600">Lo ves desde cualquier dispositivo al ingresar.</p>
      </section>
    );
  }

  if (isClaimed) return null;

  return (
    <section className={card}>
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <UserRound className="size-4 text-brand" aria-hidden="true" />
        Guardalo en una cuenta
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Opcional y gratis. Así no dependés del enlace, y es necesario para Premium.
      </p>
      {userEmail ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await claimTournament(tournamentId);
              if (!result.ok) setError(result.error);
            })
          }
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Vincular a {userEmail}
        </button>
      ) : (
        <Link
          href={`/login?modo=registro&next=${encodeURIComponent(`/gestionar/${tournamentId}`)}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Crear cuenta o ingresar
        </Link>
      )}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}

export function PremiumCard({
  tournamentId,
  isPremium,
  isSignedIn,
  price,
}: {
  tournamentId: string;
  isPremium: boolean;
  isSignedIn: boolean;
  price: number | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPremium) {
    return (
      <section className="rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 p-5 text-amber-950 shadow-sm">
        <p className="flex items-center gap-2 font-bold">
          <Crown className="size-5" aria-hidden="true" />
          Premium activo
        </p>
        <p className="mt-1 text-sm">Sin publicidad, planilla imprimible y destacado en Explorar.</p>
      </section>
    );
  }

  async function checkout() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error ?? "No se pudo iniciar el pago.");
      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "No se pudo iniciar el pago.");
      setIsLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-ink p-5 text-white shadow-sm">
      <p className="flex items-center gap-2 font-bold">
        <Crown className="size-5 text-amber-400" aria-hidden="true" />
        Pasá a Premium
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
        {["Sin publicidad para tus jugadores", "Planilla imprimible / PDF", "Destacado en Explorar"].map(
          (benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <Check className="size-4 text-lime" aria-hidden="true" />
              {benefit}
            </li>
          ),
        )}
      </ul>
      {price ? (
        <p className="mt-4 text-2xl font-bold">
          ${price.toLocaleString("es-AR")} <span className="text-sm font-normal text-slate-400">pago único</span>
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {isSignedIn ? (
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={isLoading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#009EE3] px-4 py-3 text-sm font-semibold text-white hover:bg-[#008dcc] disabled:opacity-60"
        >
          {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
          {isLoading ? "Redirigiendo…" : "Pagar con Mercado Pago"}
        </button>
      ) : (
        <>
          <Link
            href={`/login?modo=registro&next=${encodeURIComponent(`/gestionar/${tournamentId}`)}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-lime px-4 py-3 text-sm font-bold text-ink hover:brightness-95"
          >
            Crear cuenta para Premium
          </Link>
          <p className="mt-2 text-center text-xs text-slate-400">
            Premium queda asociado a tu cuenta para gestionar pagos y facturas.
          </p>
        </>
      )}
    </section>
  );
}

export function DetailsForm({
  tournamentId,
  name,
  location,
  description,
  isListed,
}: {
  tournamentId: string;
  name: string;
  location: string | null;
  description: string | null;
  isListed: boolean;
}) {
  const [state, action, isPending] = useActionState<FormState, FormData>(
    updateTournamentDetails.bind(null, tournamentId),
    { error: null },
  );
  const field =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <details className={`${card} group`}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">
        Ajustes del torneo
        <span className="text-slate-400 transition group-open:rotate-180">▾</span>
      </summary>
      <form action={action} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input name="name" defaultValue={name} required minLength={3} maxLength={120} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Ciudad o sede
          <input name="location" defaultValue={location ?? ""} maxLength={120} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Reglas o info
          <textarea name="description" defaultValue={description ?? ""} rows={3} maxLength={600} className={`${field} mt-1`} />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="is_listed" defaultChecked={isListed} className="size-4 accent-emerald-600" />
          Mostrar en Explorar torneos
        </label>
        {state.error ? <p role="alert" className="text-sm text-rose-600">{state.error}</p> : null}
        {state.saved ? <p role="status" className="text-sm text-emerald-600">Cambios guardados.</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar
        </button>
      </form>
    </details>
  );
}

export function DeleteButton({ tournamentId }: { tournamentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="px-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm("¿Eliminar este torneo? Se borran participantes y resultados. No se puede deshacer.")) return;
          startTransition(async () => {
            const result = await deleteTournament(tournamentId);
            if (!result.ok) setError(result.error);
          });
        }}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-rose-600"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Eliminar torneo
      </button>
      {error ? <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

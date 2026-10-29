"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyRecoverySession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsReady(true);
      } else {
        setError("El enlace de recuperación no es válido o ya expiró.");
      }
    }

    void verifyRecoverySession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage("Contraseña actualizada. Ya podés ingresar al panel.");
      setTimeout(() => router.replace("/"), 1200);
    } catch (updateError) {
      console.error("No se pudo actualizar la contraseña:", updateError);
      setError("No se pudo actualizar la contraseña. Solicitá otro enlace.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#39ff14] text-zinc-950 shadow-[0_0_30px_rgba(57,255,20,0.2)]">
            <Trophy className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xl font-bold tracking-tight text-white">
            Torneos<span className="text-[#39ff14]">Pro</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <LockKeyhole className="size-4 text-[#39ff14]" aria-hidden="true" />
            Nueva contraseña
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Elegí una contraseña nueva para volver a administrar tus torneos.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                disabled={!isReady}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14] disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="confirmation" className="mb-2 block text-sm font-medium text-zinc-300">
                Repetir contraseña
              </label>
              <input
                id="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                disabled={!isReady}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14] disabled:opacity-50"
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-[#39ff14]/20 bg-[#39ff14]/10 px-4 py-3 text-sm text-[#9bff8a]">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#39ff14] px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-[#6aff4d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Actualizar contraseña
          </button>
        </form>
      </div>
    </main>
  );
}

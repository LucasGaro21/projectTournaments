"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
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
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsReady(true);
      else setError("El enlace de recuperación no es válido o ya expiró.");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Pedí otro enlace.");
      return;
    }
    setMessage("Contraseña actualizada.");
    setTimeout(() => router.replace("/mis-torneos"), 1200);
  }

  const input =
    "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:opacity-50";

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <h1 className="text-xl font-bold text-slate-900">Nueva contraseña</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Nueva contraseña</span>
            <input type="password" autoComplete="new-password" minLength={8} required disabled={!isReady} value={password} onChange={(event) => setPassword(event.target.value)} className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Repetir contraseña</span>
            <input type="password" autoComplete="new-password" minLength={8} required disabled={!isReady} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={input} />
          </label>
        </div>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {message ? (
          <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="size-4" aria-hidden="true" /> {message}
          </p>
        ) : null}
        <button type="submit" disabled={!isReady || isSubmitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60">
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          Guardar contraseña
        </button>
      </form>
    </main>
  );
}

"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "ingresar" | "registro" | "recuperar";

const URL_ERRORS: Record<string, string> = {
  missing_code: "El enlace de confirmación no es válido.",
  confirmation_failed: "No se pudo confirmar la cuenta. Pedí un nuevo enlace.",
};

const TITLES: Record<Mode, string> = {
  ingresar: "Ingresar",
  registro: "Crear cuenta",
  recuperar: "Recuperar contraseña",
};

/** Only same-origin relative paths are allowed as post-login destinations. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/mis-torneos";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("modo");
  const next = safeNext(searchParams.get("next"));

  const [mode, setMode] = useState<Mode>(
    initialMode === "registro" || initialMode === "recuperar" ? initialMode : "ingresar",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(URL_ERRORS[searchParams.get("error") ?? ""] ?? null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    const callback = `${window.location.origin}/auth/callback`;

    try {
      if (mode === "recuperar") {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${callback}?next=/restablecer`,
        });
        if (recoveryError) throw recoveryError;
        setMessage("Si el correo está registrado, te enviamos un enlace para cambiar la contraseña.");
        return;
      }

      if (mode === "registro") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${callback}?next=${encodeURIComponent(next)}` },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Te enviamos un correo para confirmar la cuenta. Revisá también spam.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      router.replace(next);
      router.refresh();
    } catch (authError) {
      console.error("Error de autenticación:", authError);
      setError(
        mode === "registro"
          ? "No se pudo crear la cuenta. Revisá el correo o probá otra contraseña."
          : mode === "recuperar"
            ? "No pudimos enviar el correo. Intentá de nuevo en unos minutos."
            : "Correo o contraseña incorrectos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      {mode !== "recuperar" ? (
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {(["ingresar", "registro"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
              className={`rounded-lg py-2 transition ${mode === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              {TITLES[item]}
            </button>
          ))}
        </div>
      ) : (
        <h2 className="mb-6 text-xl font-bold text-slate-900">{TITLES.recuperar}</h2>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-800">Correo electrónico</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={input}
          />
        </label>
        {mode !== "recuperar" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Contraseña</span>
            <input
              type="password"
              autoComplete={mode === "registro" ? "new-password" : "current-password"}
              minLength={mode === "registro" ? 8 : undefined}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={input}
            />
            {mode === "registro" ? (
              <span className="mt-1 block text-xs text-slate-500">Mínimo 8 caracteres.</span>
            ) : null}
          </label>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60"
      >
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {mode === "recuperar" ? "Enviar enlace" : TITLES[mode]}
        {!isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
      </button>

      <p className="mt-5 text-center text-sm text-slate-500">
        {mode === "recuperar" ? (
          <button type="button" onClick={() => switchMode("ingresar")} className="font-medium hover:text-slate-900">
            ← Volver
          </button>
        ) : (
          <button type="button" onClick={() => switchMode("recuperar")} className="font-medium hover:text-slate-900">
            Olvidé mi contraseña
          </button>
        )}
      </p>
    </form>
  );
}

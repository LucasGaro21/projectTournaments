"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    const authError = new URLSearchParams(window.location.search).get("error");

    if (authError === "missing_code") {
      return "El enlace de confirmación no es válido.";
    }

    if (authError === "confirmation_failed") {
      return "No se pudo confirmar la cuenta. Solicitá un nuevo enlace.";
    }

    return null;
  });

  useEffect(() => {
    async function redirectAuthenticatedUser() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      }
    }

    void redirectAuthenticatedUser();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isRecovering) {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
          },
        );

        if (recoveryError) throw recoveryError;
        setMessage("Revisá tu correo para restablecer la contraseña.");
        return;
      }

      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage("Revisá tu correo para confirmar la cuenta.");
          return;
        }

        router.replace("/");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      router.replace("/");
    } catch (authError) {
      console.error("Error de autenticación:", authError);
      setError(
        isRegistering
          ? "No se pudo crear la cuenta. Verificá los datos."
          : "Correo o contraseña incorrectos.",
      );
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
          <p className="mt-2 text-sm text-zinc-500">
            {isRecovering
              ? "Recuperá el acceso a tu panel"
              : isRegistering
                ? "Creá tu cuenta de administrador"
                : "Ingresá a tu panel de control"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <LockKeyhole className="size-4 text-[#39ff14]" aria-hidden="true" />
            Acceso seguro
          </div>

          <div className="mt-6 space-y-5">
            <div className={isRecovering ? "hidden" : undefined}>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14]"
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="mt-5 rounded-xl border border-[#39ff14]/20 bg-[#39ff14]/10 px-4 py-3 text-sm text-[#9bff8a]">
              {message}
            </p>
          ) : null}

          {!isRecovering ? (
            <button
              type="button"
              onClick={() => {
                setIsRecovering(true);
                setIsRegistering(false);
                setError(null);
                setMessage(null);
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-200"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              Olvidé mi contraseña
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#39ff14] px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-[#6aff4d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isRecovering
              ? "Enviar enlace"
              : isRegistering
                ? "Crear cuenta"
                : "Ingresar al panel"}
            {!isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isRecovering) {
                setIsRecovering(false);
                setError(null);
                setMessage(null);
                return;
              }

              setIsRegistering((current) => !current);
              setError(null);
              setMessage(null);
            }}
            className="mt-5 w-full text-center text-sm text-zinc-500 transition hover:text-zinc-200"
          >
            {isRecovering
              ? "Volver al ingreso"
              : isRegistering
                ? "Ya tengo una cuenta"
                : "¿Todavía no tenés una cuenta? Registrate"}
          </button>
        </form>
      </div>
    </main>
  );
}

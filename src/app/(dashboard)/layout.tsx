"use client";

import { CalendarDays, LogOut, Settings, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const navigation = [
  {
    href: "/",
    label: "Mis Torneos",
    icon: CalendarDays,
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      if (isMounted) {
        setIsCheckingSession(false);
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-[#39ff14]">
        <Trophy className="size-8 animate-pulse" aria-label="Verificando sesión" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-zinc-800/80 bg-[#09090b]/95 px-4 py-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#39ff14] text-zinc-950 shadow-[0_0_24px_rgba(57,255,20,0.2)]">
            <Trophy className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              Torneos<span className="text-[#39ff14]">Pro</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Tournament OS
            </p>
          </div>
        </div>

        <div className="mx-3 mt-10 rounded-xl border border-[#39ff14]/10 bg-[#39ff14]/5 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#39ff14]">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Panel de administrador
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Todo bajo control, en un solo lugar.
          </p>
        </div>

        <nav className="mt-8 space-y-2" aria-label="Navegación principal">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Cerrar Sesión
        </button>
      </aside>

      <main className="min-h-screen pl-72">{children}</main>
    </div>
  );
}

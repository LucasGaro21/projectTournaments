import { CalendarDays, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-zinc-800/80 bg-[#09090b] px-4 py-6">
        <div className="px-3">
          <p className="text-xl font-bold tracking-tight">
            Torneos<span className="text-[#39ff14]">Pro</span>
          </p>
        </div>

        <nav className="mt-10 space-y-2" aria-label="Navegación principal">
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

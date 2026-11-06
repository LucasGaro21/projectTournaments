import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import AdsenseScript from "@/components/ads/AdsenseScript";
import Logo from "@/components/brand/Logo";

const nav = [
  { href: "/torneos", label: "Explorar torneos" },
  { href: "/premium", label: "Premium" },
  { href: "/mis-torneos", label: "Mis torneos" },
];

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AdsenseScript />
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/mis-torneos"
              aria-label="Mis torneos"
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            >
              <FolderKanban className="size-5" aria-hidden="true" />
            </Link>
            <Link
              href="/crear"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-soft"
            >
              <Plus className="size-4" aria-hidden="true" />
              Crear torneo
            </Link>
          </div>
        </div>
        <nav
          aria-label="Principal móvil"
          className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 md:hidden"
        >
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="no-print bg-ink text-slate-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-6">
              Fixtures, resultados y tablas de posiciones en vivo para torneos amateurs. Gratis y
              sin registro.
            </p>
          </div>
          <FooterColumn
            title="Producto"
            links={[
              ["/crear", "Crear torneo"],
              ["/torneos", "Explorar torneos"],
              ["/premium", "Premium"],
            ]}
          />
          <FooterColumn
            title="Organizadores"
            links={[
              ["/mis-torneos", "Mis torneos"],
              ["/login", "Ingresar"],
              ["/premium#preguntas", "Preguntas frecuentes"],
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              ["/privacidad", "Privacidad"],
              ["/terminos", "Términos"],
            ]}
          />
        </div>
        <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
          © {2026} TorneosPro. Hecho para los que organizan.
        </div>
      </footer>
    </>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";

/** Brand mark: a bracket that converges on the winner. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0b1220" />
      <path
        d="M7 9.5h5.5v13H7M12.5 16H18"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="16" r="4.2" fill="#a3e635" />
    </svg>
  );
}

export default function Logo({
  href = "/",
  tone = "dark",
}: {
  href?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="TorneosPro, inicio">
      <LogoMark />
      <span
        className={`text-lg font-bold tracking-tight ${tone === "light" ? "text-white" : "text-ink"}`}
      >
        Torneos
        <span className={tone === "light" ? "text-lime" : "text-brand"}>Pro</span>
      </span>
    </Link>
  );
}

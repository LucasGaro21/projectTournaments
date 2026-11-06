"use client";

import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

export default function ShareButtons({
  url,
  title,
  message,
  tone = "light",
  className = "",
}: {
  url: string;
  title: string;
  /** WhatsApp text; defaults to an invitation to follow the tournament. */
  message?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(subscribeNoop, () => "share" in navigator, () => false);
  const text = message ?? `🏆 ${title} — resultados y tabla en vivo: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá el enlace:", url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // The user closed the share sheet.
    }
  }

  const button =
    tone === "dark"
      ? "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
      : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900";

  return (
    <div className={`no-print flex flex-wrap gap-2 ${className}`}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        WhatsApp
      </a>
      <button type="button" onClick={() => void copy()} className={button}>
        {copied ? (
          <Check className="size-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <Link2 className="size-4" aria-hidden="true" />
        )}
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
      {canShare ? (
        <button type="button" onClick={() => void nativeShare()} className={button}>
          <Share2 className="size-4" aria-hidden="true" />
          Compartir
        </button>
      ) : null}
    </div>
  );
}

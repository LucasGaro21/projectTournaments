"use client";

import { useEffect, useRef } from "react";
import HouseAd from "./HouseAd";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdPlacement = "top" | "inline" | "sidebar" | "bottom";

// Literal env reads so Next.js inlines them in the client bundle.
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SLOTS: Record<AdPlacement, string | undefined> = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP,
  inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM,
};

/**
 * adsense  → real Google AdSense units
 * preview  → labelled boxes showing where each unit goes (default in development)
 * house    → our own promo ("create your tournament"), default in production
 *            until AdSense is approved
 */
const MODE =
  process.env.NEXT_PUBLIC_ADS_MODE ??
  (CLIENT ? "adsense" : process.env.NODE_ENV === "production" ? "house" : "preview");

export const AD_SPECS: Record<
  AdPlacement,
  { name: string; size: string; box: string; format: string }
> = {
  top: {
    name: "Banner superior",
    size: "728×90 escritorio · 320×100 celular",
    box: "h-[100px] md:h-[90px]",
    format: "horizontal",
  },
  inline: {
    name: "En contenido",
    size: "Responsive · 300×250 a 728×280",
    box: "h-[250px]",
    format: "fluid",
  },
  sidebar: {
    name: "Lateral fijo",
    size: "300×600 · solo escritorio",
    box: "h-[600px]",
    format: "vertical",
  },
  bottom: {
    name: "Pie de página",
    size: "Responsive · bloque múltiple",
    box: "h-[250px]",
    format: "autorelaxed",
  },
};

export default function AdSlot({
  placement,
  className = "",
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const slot = SLOTS[placement];
  const spec = AD_SPECS[placement];
  const ref = useRef<HTMLModElement>(null);
  const live = MODE === "adsense" && Boolean(CLIENT && slot);

  useEffect(() => {
    const element = ref.current;
    if (!live || !element || element.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch (error) {
      console.warn("AdSense no pudo cargar el anuncio:", error);
    }
  }, [live]);

  if (live) {
    return (
      <aside aria-label="Publicidad" className={`no-print ${className}`}>
        <p className="mb-1 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">
          Publicidad
        </p>
        <ins
          ref={ref}
          className={`adsbygoogle block w-full overflow-hidden ${spec.box}`}
          style={{ display: "block" }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
          data-ad-format={spec.format}
          data-ad-layout={placement === "inline" ? "in-article" : undefined}
          data-full-width-responsive={placement === "sidebar" ? undefined : "true"}
        />
      </aside>
    );
  }

  if (MODE === "preview") {
    return (
      <aside
        aria-label={`Espacio publicitario: ${spec.name}`}
        className={`no-print flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/70 text-center ${spec.box} ${className}`}
      >
        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
          Anuncio · {spec.name}
        </span>
        <span className="text-xs text-amber-800">{spec.size}</span>
      </aside>
    );
  }

  return <HouseAd placement={placement} className={className} />;
}

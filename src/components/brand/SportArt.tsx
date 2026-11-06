import type { Sport } from "@/lib/tournament/types";

type Theme = { from: string; to: string; line: string };

const THEMES: Record<Sport, Theme> = {
  Fútbol: { from: "#065f46", to: "#16a34a", line: "rgba(255,255,255,0.45)" },
  Pádel: { from: "#1e3a8a", to: "#2563eb", line: "rgba(255,255,255,0.5)" },
  Tenis: { from: "#9a3412", to: "#ea580c", line: "rgba(255,255,255,0.55)" },
  Básquet: { from: "#7c2d12", to: "#d97706", line: "rgba(255,255,255,0.4)" },
  Vóley: { from: "#0e7490", to: "#f59e0b", line: "rgba(255,255,255,0.5)" },
  "Ping pong": { from: "#1e40af", to: "#0ea5e9", line: "rgba(255,255,255,0.6)" },
  eSports: { from: "#3b0764", to: "#7c3aed", line: "rgba(255,255,255,0.18)" },
  Truco: { from: "#7f1d1d", to: "#b91c1c", line: "rgba(255,255,255,0.3)" },
  Ajedrez: { from: "#0f172a", to: "#334155", line: "rgba(255,255,255,0.12)" },
  Otro: { from: "#0b1220", to: "#047857", line: "rgba(255,255,255,0.18)" },
};

/**
 * Illustrated cover for each sport (court/pitch drawn in SVG), used on cards
 * and tournament headers. Pure SVG: no image hosting, crisp on any screen.
 */
export default function SportArt({
  sport,
  className = "",
}: {
  sport: Sport;
  className?: string;
}) {
  const theme = THEMES[sport] ?? THEMES.Otro;
  const id = `g-${sport.replace(/\W/g, "") || "x"}`;

  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.from} />
          <stop offset="1" stopColor={theme.to} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${id})`} />
      <g fill="none" stroke={theme.line} strokeWidth="2.5">
        <Court sport={sport} line={theme.line} />
      </g>
    </svg>
  );
}

function Court({ sport, line }: { sport: Sport; line: string }) {
  switch (sport) {
    case "Fútbol":
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((stripe) => (
            <rect
              key={stripe}
              x={stripe * 50}
              y="0"
              width="25"
              height="200"
              fill="rgba(255,255,255,0.04)"
              stroke="none"
            />
          ))}
          <rect x="30" y="20" width="340" height="160" />
          <line x1="200" y1="20" x2="200" y2="180" />
          <circle cx="200" cy="100" r="32" />
          <rect x="30" y="60" width="50" height="80" />
          <rect x="320" y="60" width="50" height="80" />
          <circle cx="200" cy="100" r="3" fill={line} />
        </>
      );
    case "Pádel":
    case "Tenis":
      return (
        <>
          <rect x="40" y="25" width="320" height="150" />
          <line x1="200" y1="15" x2="200" y2="185" strokeWidth="4" strokeDasharray="2 5" />
          <line x1="110" y1="25" x2="110" y2="175" />
          <line x1="290" y1="25" x2="290" y2="175" />
          <line x1="110" y1="100" x2="290" y2="100" />
          {sport === "Tenis" ? (
            <>
              <line x1="40" y1="45" x2="360" y2="45" />
              <line x1="40" y1="155" x2="360" y2="155" />
            </>
          ) : null}
          <circle cx="320" cy="60" r="9" fill="#d9f99d" stroke="none" />
        </>
      );
    case "Básquet":
      return (
        <>
          <rect x="30" y="20" width="340" height="160" />
          <line x1="200" y1="20" x2="200" y2="180" />
          <circle cx="200" cy="100" r="28" />
          <rect x="30" y="72" width="60" height="56" />
          <rect x="310" y="72" width="60" height="56" />
          <path d="M30 40 A 90 70 0 0 1 30 160" transform="translate(40 0)" />
          <path d="M370 40 A 90 70 0 0 0 370 160" transform="translate(-40 0)" />
        </>
      );
    case "Vóley":
      return (
        <>
          <rect x="40" y="30" width="320" height="140" />
          <line x1="200" y1="20" x2="200" y2="180" strokeWidth="5" />
          <line x1="150" y1="30" x2="150" y2="170" />
          <line x1="250" y1="30" x2="250" y2="170" />
          <circle cx="300" cy="70" r="16" fill="rgba(255,255,255,0.85)" stroke="none" />
        </>
      );
    case "Ping pong":
      return (
        <>
          <rect x="70" y="40" width="260" height="120" strokeWidth="4" />
          <line x1="70" y1="100" x2="330" y2="100" />
          <line x1="200" y1="30" x2="200" y2="170" strokeWidth="5" />
          <circle cx="270" cy="70" r="6" fill="#fff" stroke="none" />
        </>
      );
    case "eSports":
      return (
        <>
          {Array.from({ length: 11 }, (_, index) => (
            <line key={`v${index}`} x1={index * 40} y1="0" x2={index * 40} y2="200" />
          ))}
          {Array.from({ length: 6 }, (_, index) => (
            <line key={`h${index}`} x1="0" y1={index * 40} x2="400" y2={index * 40} />
          ))}
          <path
            d="M150 120 h100 a20 20 0 0 0 0-40 h-100 a20 20 0 0 0 0 40z"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="3"
          />
        </>
      );
    case "Ajedrez":
      return (
        <>
          {Array.from({ length: 40 }, (_, index) => {
            const x = index % 10;
            const y = Math.floor(index / 10);
            return (x + y) % 2 === 0 ? (
              <rect
                key={index}
                x={x * 40}
                y={y * 50}
                width="40"
                height="50"
                fill="rgba(255,255,255,0.08)"
                stroke="none"
              />
            ) : null;
          })}
        </>
      );
    case "Truco":
      return (
        <>
          {[0, 1, 2].map((card) => (
            <rect
              key={card}
              x={150 + card * 30}
              y={50 - card * 4}
              width="70"
              height="104"
              rx="8"
              transform={`rotate(${(card - 1) * 12} ${185 + card * 30} 120)`}
              fill="rgba(255,255,255,0.12)"
            />
          ))}
        </>
      );
    default:
      return (
        <>
          <path d="M60 50h50v100H60M110 100h50" />
          <path d="M240 50h50v100h-50M290 100h50" />
          <circle cx="200" cy="100" r="22" fill="rgba(163,230,53,0.85)" stroke="none" />
        </>
      );
  }
}

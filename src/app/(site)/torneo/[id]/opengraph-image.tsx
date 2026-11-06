import { ImageResponse } from "next/og";
import { getPublicTournament } from "@/lib/data/public";
import { computeStandings, findChampion } from "@/lib/tournament/standings";
import { FORMAT_LABELS } from "@/lib/tournament/types";

export const alt = "Tabla de posiciones del torneo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Preview shown when the link is shared on WhatsApp/Telegram/X. Showing the
 * live leaders makes the link more clickable, which brings players back to
 * the page (and its ads) after every match.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicTournament(id);

  if (!data) {
    return new ImageResponse(<Frame title="TorneosPro" subtitle="Torneo no disponible" rows={[]} />, size);
  }

  const { tournament, competitors, matches } = data;
  const champion = findChampion(tournament.format, competitors, matches);

  let rows: Array<{ label: string; value: string }> = [];
  if (tournament.format === "Americano") {
    rows = computeStandings(competitors, matches)
      .slice(0, 4)
      .map((row, index) => ({ label: `${index + 1}. ${row.name}`, value: `${row.points} pts` }));
  }

  const subtitle = champion
    ? `Campeón: ${champion.name}`
    : `${tournament.sport} · ${FORMAT_LABELS[tournament.format]} · ${tournament.participant_count} participantes`;

  return new ImageResponse(
    <Frame title={tournament.name} subtitle={subtitle} rows={champion ? [] : rows} />,
    size,
  );
}

function Frame({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "linear-gradient(135deg, #09090b 0%, #111827 60%, #0b2a0b 100%)",
        color: "#f4f4f5",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 700 }}>
        <div
          style={{
            display: "flex",
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#39ff14",
            color: "#09090b",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
        >
          🏆
        </div>
        <span>
          Torneos<span style={{ color: "#39ff14" }}>Pro</span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: title.length > 40 ? 56 : 72, fontWeight: 800, lineHeight: 1.05 }}>
          {title.length > 70 ? `${title.slice(0, 67)}…` : title}
        </div>
        <div style={{ fontSize: 32, color: "#9bff8a" }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "16px 20px",
              borderRadius: 16,
              border: "1px solid #27272a",
              background: "rgba(24,24,27,0.8)",
              fontSize: 24,
            }}
          >
            <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {row.label}
            </span>
            <span style={{ color: "#39ff14", fontWeight: 700 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

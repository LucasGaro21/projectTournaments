import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#0b1220",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="140" height="140" viewBox="0 0 32 32">
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
    </div>,
    size,
  );
}

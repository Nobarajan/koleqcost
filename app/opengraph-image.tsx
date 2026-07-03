import { ImageResponse } from "next/og";

export const alt =
  "KoleqCost — Landed Cost & Profit Calculator for Collectors";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0f1a14 0%, #1a2e24 45%, #0d1812 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(72, 160, 120, 0.25)",
              border: "2px solid rgba(120, 200, 150, 0.5)",
            }}
          />
          <span
            style={{
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(160, 210, 180, 0.85)",
            }}
          >
            Estimate only
          </span>
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#f0faf4",
            lineHeight: 1.05,
            marginBottom: "24px",
          }}
        >
          KoleqCost
        </div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 500,
            color: "rgba(200, 230, 210, 0.92)",
            lineHeight: 1.35,
            maxWidth: "900px",
            marginBottom: "40px",
          }}
        >
          Know your real cost before you buy.
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "rgba(160, 190, 170, 0.75)",
            lineHeight: 1.5,
            maxWidth: "820px",
          }}
        >
          Landed cost, import estimate, resale profit, ROI & break-even for
          collectors in Malaysia
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}


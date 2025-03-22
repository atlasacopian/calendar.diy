import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const alt = "calendar.diy - A minimalist project calendar"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation
export default async function Image() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 128,
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* Calendar icon - larger version but same design as favicon */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 32 32"
        style={{
          marginBottom: 40,
        }}
      >
        {/* Calendar binding */}
        <g transform="translate(0, 1) scale(9.375)">
          <rect x="4" y="0" width="24" height="2" rx="1" fill="#888888" />
          <circle cx="7" cy="1" r="1.5" fill="#555555" />
          <circle cx="12" cy="1" r="1.5" fill="#555555" />
          <circle cx="17" cy="1" r="1.5" fill="#555555" />
          <circle cx="22" cy="1" r="1.5" fill="#555555" />
          <circle cx="27" cy="1" r="1.5" fill="#555555" />
        </g>

        {/* Calendar body */}
        <g transform="scale(9.375)">
          <rect x="4" y="3" width="24" height="26" rx="2" fill="white" stroke="#dddddd" strokeWidth="1" />

          {/* Calendar header */}
          <rect x="4" y="3" width="24" height="6" rx="1" fill="#d85a5a" />

          {/* Month text */}
          <text x="8" y="8" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" fill="white">
            JUL
          </text>

          {/* Calendar grid */}
          <line x1="4" y1="13" x2="28" y2="13" stroke="#eeeeee" strokeWidth="0.5" />
          <line x1="4" y1="18" x2="28" y2="18" stroke="#eeeeee" strokeWidth="0.5" />
          <line x1="4" y1="23" x2="28" y2="23" stroke="#eeeeee" strokeWidth="0.5" />

          <line x1="8" y1="9" x2="8" y2="29" stroke="#eeeeee" strokeWidth="0.5" />
          <line x1="12" y1="9" x2="12" y2="29" stroke="#eeeeee" strokeWidth="0.5" />
          <line x1="16" y1="9" x2="16" y2="29" stroke="#eeeeee" strokeWidth="0.5" />
          <line x1="20" y1="9" x2="20" y2="29" stroke="#eeeeee" strokeWidth="0.5" />
          <line x1="24" y1="9" x2="24" y2="29" stroke="#eeeeee" strokeWidth="0.5" />

          {/* Page curl effect */}
          <path d="M24,24 Q28,24 28,28 L24,28 Z" fill="#f5f5f5" stroke="#dddddd" strokeWidth="0.5" />
          <path d="M24,24 L24,28 L28,28 Z" fill="#eeeeee" stroke="#dddddd" strokeWidth="0.5" />
        </g>
      </svg>

      <div
        style={{
          fontSize: 64,
          fontWeight: 300,
          letterSpacing: "-0.05em",
          color: "#333",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span style={{ fontSize: 72 }}>🗓️</span>
        <span>calendar.diy</span>
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 300,
          color: "#666",
          marginTop: 20,
        }}
      >
        A minimalist project calendar
      </div>
    </div>,
    // ImageResponse options
    {
      ...size,
    },
  )
}


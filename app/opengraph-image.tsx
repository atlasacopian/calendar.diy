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
      {/* Calendar icon - larger version */}
      <div
        style={{
          width: 300,
          height: 300,
          position: "relative",
          marginBottom: 40,
        }}
      >
        {/* Calendar binding */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 30,
            width: 240,
            height: 20,
            background: "#888888",
            borderRadius: 10,
          }}
        />

        {/* Calendar body */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 240,
            height: 260,
            background: "white",
            border: "3px solid #dddddd",
            borderRadius: 20,
          }}
        />

        {/* Calendar header */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 240,
            height: 60,
            background: "#d85a5a",
            borderTopLeftRadius: 17,
            borderTopRightRadius: 17,
          }}
        />

        {/* Month text */}
        <div
          style={{
            position: "absolute",
            top: 45,
            left: 60,
            fontSize: 40,
            fontWeight: "bold",
            color: "white",
          }}
        >
          JUL
        </div>
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 300,
          letterSpacing: "-0.05em",
          color: "#333",
        }}
      >
        calendar.diy
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


import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 32,
  height: 32,
}

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 24,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        background: "white",
        position: "relative",
      }}
    >
      {/* Calendar binding */}
      <div
        style={{
          position: "absolute",
          top: 1,
          left: 4,
          width: 24,
          height: 2,
          background: "#888888",
          borderRadius: 1,
        }}
      />

      {/* Calendar body */}
      <div
        style={{
          position: "absolute",
          top: 3,
          left: 4,
          width: 24,
          height: 26,
          background: "white",
          border: "1px solid #dddddd",
          borderRadius: 2,
        }}
      />

      {/* Calendar header */}
      <div
        style={{
          position: "absolute",
          top: 3,
          left: 4,
          width: 24,
          height: 6,
          background: "#d85a5a",
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />

      {/* Month text */}
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 8,
          fontSize: 5,
          fontWeight: "bold",
          color: "white",
        }}
      >
        JUL
      </div>
    </div>,
    // ImageResponse options
    {
      ...size,
    },
  )
}


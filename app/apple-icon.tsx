import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 180,
  height: 180,
}

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 140,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        borderRadius: "22%",
      }}
    >
      🗓️
    </div>,
    {
      ...size,
    },
  )
}


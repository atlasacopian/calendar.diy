import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 32,
  height: 32,
}

export const contentType = "image/x-icon"

// Image generation
export default function Favicon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      🗓️
    </div>,
    {
      ...size,
    },
  )
}


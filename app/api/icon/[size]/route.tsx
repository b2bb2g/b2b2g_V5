import { ImageResponse } from "next/og";

// Generated app icons for the PWA manifest (no binary assets in the repo).
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ size: string }> }
) {
  const { size } = await ctx.params;
  const s = Math.min(Math.max(Number.parseInt(size, 10) || 192, 64), 1024);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3182f6",
          color: "#ffffff",
          fontSize: s * 0.5,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        B
      </div>
    ),
    { width: s, height: s }
  );
}

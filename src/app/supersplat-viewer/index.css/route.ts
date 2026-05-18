import { css } from "@playcanvas/supersplat-viewer";

export const runtime = "nodejs";

export function GET() {
  return new Response(css, {
    headers: {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}

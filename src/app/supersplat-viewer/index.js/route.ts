import { js } from "@playcanvas/supersplat-viewer";

export const runtime = "nodejs";

export function GET() {
  return new Response(js, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}

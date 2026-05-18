import { html } from "@playcanvas/supersplat-viewer";

export const runtime = "nodejs";

function buildViewerHtml() {
  return html
    .replace("<title>SuperSplat Viewer</title>", "<title>Tempo Casa SuperSplat Viewer</title>")
    .replace('<base href="">', '<base href="/supersplat-viewer/">')
    .replace(
      "const contentUrl = url.searchParams.has('content') ? url.searchParams.get('content') : './scene.compressed.ply';",
      "const contentUrl = url.searchParams.has('content') || url.searchParams.has('load') ? (url.searchParams.get('content') ?? url.searchParams.get('load')) : 'https://developer.playcanvas.com/assets/toy-cat.sog';"
    );
}

export function GET() {
  return new Response(buildViewerHtml(), {
    headers: {
      "content-type": "text/html; charset=utf-8"
    }
  });
}

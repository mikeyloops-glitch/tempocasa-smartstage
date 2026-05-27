import { NextResponse } from "next/server";

const disabledHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Demo access disabled</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #071a33;
        color: #ffffff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 560px);
        padding: 32px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 24px 90px rgba(0, 0, 0, 0.28);
      }
      p {
        margin: 12px 0 0;
        color: rgba(255, 255, 255, 0.76);
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Demo access disabled</h1>
      <p>This branded pilot link has been retired. Please request the current private SmartStage demo link.</p>
    </main>
  </body>
</html>`;

export default function middleware() {
  return new NextResponse(disabledHtml, {
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow"
    },
    status: 410
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"]
};

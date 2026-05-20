import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const allowedHosts = new Set(["res.cloudinary.com"]);

function sanitizeFilename(value: string | null) {
  const fallback = "smartstage-render.png";
  const name = (value || fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/(^[-.]+|[-.]+$)/g, "")
    .slice(0, 96);

  return name || fallback;
}

function isAllowedImageUrl(value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  return parsed.protocol === "https:" && allowedHosts.has(parsed.hostname);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get("url");
  const filename = sanitizeFilename(searchParams.get("filename"));

  if (!sourceUrl || !isAllowedImageUrl(sourceUrl)) {
    return NextResponse.json({ message: "Download URL is not allowed." }, { status: 400 });
  }

  const response = await fetch(sourceUrl, {
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ message: "Image could not be downloaded." }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") ?? "image/png";

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ message: "Download source is not an image." }, { status: 415 });
  }

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": contentType
    }
  });
}

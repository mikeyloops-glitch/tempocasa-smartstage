import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

function isOpenAIConfigured() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.startsWith("sk-") && !key.includes("replace_me"));
}

function fallbackReport(capturedCredits: number, hasWalkthroughVideo = false) {
  const missing = Math.max(0, 8 - capturedCredits);
  const isReady = capturedCredits >= 8 || hasWalkthroughVideo;
  const summary =
    capturedCredits >= 8
      ? "Room package has all 8 guided captures and is ready for a 3D draft preview."
      : hasWalkthroughVideo
        ? "Walkthrough video source is ready for a reconstruction proof of concept and SuperSplat handoff."
        : `Capture ${missing} more guided angle${missing === 1 ? "" : "s"} before creating the 3D draft.`;

  return {
    status: isReady ? "ready" : "needs_more_captures",
    summary,
    checks: [
      "Start at 12 o'clock / 0 degrees.",
      "Keep the phone level and rotate from one angle marker to the next.",
      "Hold each wall steady inside the ghost frame before capture.",
      "For video, walk slowly with steady overlap between walls, doorways, floors, and ceiling edges.",
      "Avoid people, mirrors, heavy motion blur, and overexposed windows."
    ],
    nextAction: isReady ? "Open the 3D preview and save the room node." : "Continue guided capture."
  };
}

function formatCheckLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function normalizeChecks(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${formatCheckLabel(key)}: ${String(item)}`)
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeReport(value: unknown, capturedCredits: number, hasWalkthroughVideo: boolean) {
  const fallback = fallbackReport(capturedCredits, hasWalkthroughVideo);

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const report = value as {
    checks?: unknown;
    nextAction?: unknown;
    status?: unknown;
    summary?: unknown;
  };
  const checks = normalizeChecks(report.checks);

  return {
    status: typeof report.status === "string" ? report.status : fallback.status,
    summary: typeof report.summary === "string" ? report.summary : fallback.summary,
    checks: checks.length > 0 ? checks : fallback.checks,
    nextAction: typeof report.nextAction === "string" ? report.nextAction : fallback.nextAction
  };
}

export async function POST(request: Request) {
  let payload: {
    manifest?: {
      room?: {
        capturedCredits?: number;
        name?: string;
        type?: string;
      };
      shots?: Array<{
        angle?: number;
        captured?: boolean;
        label?: string;
      }>;
      sourceMode?: string;
      superSplat?: {
        contentUrl?: string;
        viewerUrl?: string;
      };
      walkthroughVideo?: {
        capturedAt?: string;
        fileName?: string;
        size?: number;
      } | null;
      workflow?: string;
    };
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Tour capture payload could not be read." }, { status: 400 });
  }

  const manifest = payload.manifest;
  const capturedCredits =
    manifest?.shots?.filter((shot) => shot.captured).length ?? manifest?.room?.capturedCredits ?? 0;
  const hasWalkthroughVideo = Boolean(manifest?.walkthroughVideo?.fileName);

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      {
        report: fallbackReport(capturedCredits, hasWalkthroughVideo),
        message: "OpenAI is not configured yet. The local capture QA fallback was used."
      },
      { status: 202 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_TOUR_MODEL ?? "gpt-4o-mini";

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a real-estate 3D capture QA assistant for Tempo Casa. Return compact JSON only with keys: status, summary, checks, nextAction. checks must be an array of short strings. Focus on guided 360 capture quality, walkthrough-video capture quality, complete room coverage, room geometry, camera stability, and readiness for a Gaussian splat or WebGL tour preview."
        },
        {
          role: "user",
          content: JSON.stringify({
            workflow: manifest?.workflow ?? "AI Virtual Tour",
            room: manifest?.room,
            sourceMode: manifest?.sourceMode,
            walkthroughVideo: manifest?.walkthroughVideo,
            superSplat: manifest?.superSplat,
            shots: manifest?.shots
          })
        }
      ]
    });

    const text = completion.choices[0]?.message?.content;
    const parsedReport = text ? JSON.parse(text) : fallbackReport(capturedCredits, hasWalkthroughVideo);
    const report = normalizeReport(parsedReport, capturedCredits, hasWalkthroughVideo);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("OpenAI tour capture QA failed", error);
    return NextResponse.json(
      {
        report: fallbackReport(capturedCredits, hasWalkthroughVideo),
        message: "OpenAI tour QA did not complete. The local capture QA fallback was used."
      },
      { status: 202 }
    );
  }
}

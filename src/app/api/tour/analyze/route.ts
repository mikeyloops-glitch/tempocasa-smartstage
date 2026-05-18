import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

function isOpenAIConfigured() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.startsWith("sk-") && !key.includes("replace_me"));
}

function fallbackReport(capturedCredits: number) {
  const missing = Math.max(0, 8 - capturedCredits);

  return {
    status: capturedCredits >= 8 ? "ready" : "needs_more_captures",
    summary:
      capturedCredits >= 8
        ? "Room package has all 8 guided captures and is ready for a 3D draft preview."
        : `Capture ${missing} more guided angle${missing === 1 ? "" : "s"} before creating the 3D draft.`,
    checks: [
      "Start at 12 o'clock / 0 degrees.",
      "Keep the phone level and rotate from one angle marker to the next.",
      "Hold each wall steady inside the ghost frame before capture.",
      "Avoid people, mirrors, heavy motion blur, and overexposed windows."
    ],
    nextAction: capturedCredits >= 8 ? "Open the 3D preview and save the room node." : "Continue guided capture."
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

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      {
        report: fallbackReport(capturedCredits),
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
            "You are a real-estate 3D capture QA assistant for Tempo Casa. Return compact JSON only with keys: status, summary, checks, nextAction. Focus on guided 360 capture quality, complete angle coverage, room geometry, camera stability, and readiness for a Gaussian splat or WebGL tour preview."
        },
        {
          role: "user",
          content: JSON.stringify({
            workflow: manifest?.workflow ?? "AI Virtual Tour",
            room: manifest?.room,
            shots: manifest?.shots
          })
        }
      ]
    });

    const text = completion.choices[0]?.message?.content;
    const report = text ? JSON.parse(text) : fallbackReport(capturedCredits);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("OpenAI tour capture QA failed", error);
    return NextResponse.json(
      {
        report: fallbackReport(capturedCredits),
        message: "OpenAI tour QA did not complete. The local capture QA fallback was used."
      },
      { status: 202 }
    );
  }
}

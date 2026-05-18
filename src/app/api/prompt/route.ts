import { NextResponse } from "next/server";
import { buildPromptPreview } from "@/lib/ai/prompt-engine";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    roomType?: string;
    style?: string;
    stagingLevel?: string;
    generationMode?: string;
    customInstructions?: string;
  };

  return NextResponse.json(
    buildPromptPreview({
      roomType: body.roomType,
      style: body.style,
      stagingLevel: body.stagingLevel,
      generationMode: body.generationMode,
      customInstructions: body.customInstructions
    })
  );
}

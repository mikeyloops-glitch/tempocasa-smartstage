import type OpenAI from "openai";
import type { GeometryAnalysis } from "@/lib/types";

const geometrySchemaPrompt = [
  "Analyze this real-estate room photo only for structural room geometry.",
  "Return compact JSON with exact keys: hasIrregularGeometry, confidence, shapeSummary, protectedArchitecture, stagingGuidance, riskFlags.",
  "Detect and describe any curved walls, angled or diagonal walls, non-square corners, bay windows, alcoves, niches, arched openings, sloped ceilings, partial-height walls, asymmetrical wall returns, and unusual perspective lines.",
  "Do not describe furniture style. Focus on what a virtual staging model must preserve exactly so the after image aligns with the uploaded before photo.",
  "protectedArchitecture and stagingGuidance must be arrays of short strings. riskFlags must name likely generation mistakes such as squaring off a curved wall or flattening an angled partition."
].join(" ");

function asArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function clampConfidence(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.min(1, numberValue)) : 0;
}

function normalizeGeometryAnalysis(value: unknown): GeometryAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  return {
    hasIrregularGeometry: Boolean(data.hasIrregularGeometry),
    confidence: clampConfidence(data.confidence),
    shapeSummary: typeof data.shapeSummary === "string" ? data.shapeSummary.trim().slice(0, 700) : "",
    protectedArchitecture: asArray(data.protectedArchitecture).slice(0, 10),
    stagingGuidance: asArray(data.stagingGuidance).slice(0, 10),
    riskFlags: asArray(data.riskFlags).slice(0, 8)
  };
}

export async function analyzeRoomGeometry(input: {
  openai: OpenAI;
  imageBuffer: Buffer;
  contentType: string;
}) {
  if (process.env.OPENAI_GEOMETRY_ANALYSIS === "false") {
    return null;
  }

  const model = process.env.OPENAI_GEOMETRY_MODEL ?? "gpt-4o-mini";
  const imageUrl = `data:${input.contentType};base64,${input.imageBuffer.toString("base64")}`;

  try {
    const completion = (await input.openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an architecture-preservation QA model for MLS-safe AI virtual staging. You identify structural room geometry that must be locked before image editing."
        },
        {
          role: "user",
          content: [
            { type: "text", text: geometrySchemaPrompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      stream: false
    } as Parameters<typeof input.openai.chat.completions.create>[0])) as { choices?: Array<{ message?: { content?: string | null } }> };

    const text = completion.choices?.[0]?.message?.content;
    const parsed = text ? JSON.parse(text) : null;
    return normalizeGeometryAnalysis(parsed);
  } catch (error) {
    console.warn("Room geometry analysis failed; continuing with base geometry lock rules.", error);
    return null;
  }
}

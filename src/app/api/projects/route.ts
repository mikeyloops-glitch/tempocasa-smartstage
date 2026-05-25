import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerProjects, registerServerProject } from "@/lib/server/project-registry";
import type { ProjectRecord } from "@/lib/types";

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  originalUrl: z.string(),
  stagedUrl: z.string().optional(),
  createdAt: z.string(),
  roomType: z.string(),
  style: z.string(),
  stagingLevel: z.string(),
  generationMode: z.string().optional(),
  promptMode: z.enum(["add-on", "custom"]).optional(),
  customInstructions: z.string().optional(),
  status: z.enum(["draft", "processing", "ready", "configuration_required", "failed"]),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  prompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  geometryAnalysis: z
    .object({
      hasIrregularGeometry: z.boolean(),
      confidence: z.number(),
      shapeSummary: z.string(),
      protectedArchitecture: z.array(z.string()),
      stagingGuidance: z.array(z.string()),
      riskFlags: z.array(z.string())
    })
    .optional()
});

export async function GET() {
  return NextResponse.json({ projects: getServerProjects() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid project payload." }, { status: 400 });
  }

  const project = registerServerProject(parsed.data as ProjectRecord);
  return NextResponse.json({ project }, { status: 201 });
}

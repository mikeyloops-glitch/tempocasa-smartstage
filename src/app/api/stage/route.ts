import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import OpenAI, { toFile } from "openai";
import { buildStagingPrompt, isRoomType, isStagingLevel, isStagingStyle } from "@/lib/ai/prompt-engine";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { registerServerProject } from "@/lib/server/project-registry";
import type { GenerationMode, ProjectRecord } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedMaskTypes = new Set(["image/png"]);
const maxBytes = 20 * 1024 * 1024;
const generationModes = new Set<GenerationMode>(["stage", "empty", "custom"]);
const imageQualities = new Set(["standard", "low", "medium", "high", "auto"]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function integrationError(message: string, detail?: unknown) {
  if (detail) {
    console.error(message, detail);
  }

  return NextResponse.json(
    {
      message,
      action: "Check OPENAI_API_KEY, OPENAI_IMAGE_MODEL, and Cloudinary settings in .env.local."
    },
    { status: 502 }
  );
}

function sanitizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function extensionForType(contentType: string) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function getImageQuality(model: string) {
  if (model === "dall-e-2") {
    return "standard";
  }

  const quality = process.env.OPENAI_IMAGE_QUALITY;
  return quality && imageQualities.has(quality) ? quality : "medium";
}

function bufferToDataUrl(buffer: Buffer, contentType: string) {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function isOpenAIConfigured() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.startsWith("sk-") && !key.includes("replace_me"));
}

function isGenerationMode(value: unknown): value is GenerationMode {
  return typeof value === "string" && generationModes.has(value as GenerationMode);
}

async function fileToBuffer(file: File) {
  return Buffer.from(await file.arrayBuffer());
}

async function resolveGeneratedBuffer(result: { data?: Array<{ b64_json?: string; url?: string }> }) {
  const generated = result.data?.[0];

  if (!generated) {
    throw new Error("OpenAI returned no image data.");
  }

  if ("b64_json" in generated && generated.b64_json) {
    return Buffer.from(generated.b64_json, "base64");
  }

  if ("url" in generated && generated.url) {
    const response = await fetch(generated.url);
    if (!response.ok) {
      throw new Error("Generated image URL could not be downloaded.");
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("OpenAI returned an unsupported image response.");
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Stage upload could not be parsed", error);
    return jsonError("Upload could not be read. Please retry with a JPG, PNG, or WEBP image.", 400);
  }

  const image = formData.get("image");
  const mask = formData.get("mask");
  const roomTypeValue = formData.get("roomType");
  const styleValue = formData.get("style");
  const stagingLevelValue = formData.get("stagingLevel");
  const generationModeValue = formData.get("generationMode");
  const customInstructionsValue = formData.get("customInstructions");
  const projectNameValue = formData.get("projectName");

  if (!(image instanceof File)) {
    return jsonError("A room image is required.", 400);
  }

  if (!allowedTypes.has(image.type)) {
    return jsonError("Use JPG, PNG, or WEBP images.", 415);
  }

  if (image.size > maxBytes) {
    return jsonError("Image must be 20 MB or smaller.", 413);
  }

  if (mask && !(mask instanceof File)) {
    return jsonError("Mask upload is invalid.", 400);
  }

  if (mask instanceof File && mask.size > maxBytes) {
    return jsonError("Mask must be 20 MB or smaller.", 413);
  }

  if (mask instanceof File && mask.size > 0 && !allowedMaskTypes.has(mask.type)) {
    return jsonError("Mask must be a PNG image.", 415);
  }

  const roomType = isRoomType(roomTypeValue) ? roomTypeValue : "Living Room";
  const style = isStagingStyle(styleValue) ? styleValue : "Luxury Modern";
  const stagingLevel = isStagingLevel(stagingLevelValue) ? stagingLevelValue : "Luxury";
  const generationMode = isGenerationMode(generationModeValue) ? generationModeValue : "stage";
  const customInstructions = typeof customInstructionsValue === "string" ? customInstructionsValue : "";
  const promptPackage = buildStagingPrompt({ roomType, style, stagingLevel, generationMode, customInstructions });
  const imageBuffer = await fileToBuffer(image);
  const safeBaseName = sanitizeName(
    typeof projectNameValue === "string" && projectNameValue.length > 0 ? projectNameValue : image.name
  );
  const projectId = randomUUID();

  const originalUploadPromise = uploadBufferToCloudinary({
    buffer: imageBuffer,
    fileName: `${safeBaseName || "room"}-original-${projectId}`,
    contentType: image.type,
    tags: ["tempocasa-smartstage", "original", roomType, style, stagingLevel],
    context: {
      room_type: roomType,
      style,
      staging_level: stagingLevel
    }
  });

  if (!isOpenAIConfigured()) {
    const originalUpload = await originalUploadPromise;
    const originalUrl = originalUpload?.secure_url ?? bufferToDataUrl(imageBuffer, image.type);
    const project: ProjectRecord = {
      id: projectId,
      name: typeof projectNameValue === "string" && projectNameValue ? projectNameValue : "AI SmartStage project",
      originalUrl,
      createdAt: new Date().toISOString(),
      roomType,
      style,
      stagingLevel,
      generationMode,
      customInstructions: promptPackage.customInstructions,
      status: "configuration_required",
      fileName: image.name,
      fileSize: image.size,
      prompt: promptPackage.prompt,
      negativePrompt: promptPackage.negativePrompt
    };

    registerServerProject(project);

    return NextResponse.json(
      {
        project,
        promptPackage,
        cloudinary: {
          originalPublicId: originalUpload?.public_id
        },
        message: "OpenAI is not configured yet. Prompt and original image were prepared for the staging pipeline."
      },
      { status: 202 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const imageFile = await toFile(imageBuffer, `${safeBaseName || "room"}.${extensionForType(image.type)}`, {
    type: image.type || "image/png"
  });

  const editParams: Record<string, unknown> = {
    model,
    image: imageFile,
    prompt: promptPackage.prompt,
    quality: getImageQuality(model),
    size: "auto",
    n: 1
  };

  if (mask instanceof File && mask.size > 0) {
    const maskBuffer = await fileToBuffer(mask);
    editParams.mask = await toFile(maskBuffer, mask.name || "mask.png", { type: mask.type || "image/png" });
  }

  let stagedBuffer: Buffer;
  let originalUpload: Awaited<typeof originalUploadPromise>;

  try {
    const [resolvedOriginalUpload, editResult] = await Promise.all([
      originalUploadPromise,
      openai.images.edit(editParams as unknown as Parameters<typeof openai.images.edit>[0])
    ]);
    originalUpload = resolvedOriginalUpload;
    stagedBuffer = await resolveGeneratedBuffer(editResult);
  } catch (error) {
    return integrationError("OpenAI staging failed. The upload and prompt were valid, but image editing did not complete.", error);
  }

  const originalUrl = originalUpload?.secure_url ?? bufferToDataUrl(imageBuffer, image.type);

  const stagedUpload = await uploadBufferToCloudinary({
    buffer: stagedBuffer,
    fileName: `${safeBaseName || "room"}-staged-${projectId}`,
    contentType: "image/png",
    tags: ["tempocasa-smartstage", "staged", roomType, style, stagingLevel],
    context: {
      room_type: roomType,
      style,
      staging_level: stagingLevel
    }
  });

  const project: ProjectRecord = {
    id: projectId,
    name: typeof projectNameValue === "string" && projectNameValue ? projectNameValue : "AI SmartStage project",
    originalUrl,
    stagedUrl: stagedUpload?.secure_url ?? bufferToDataUrl(stagedBuffer, "image/png"),
    createdAt: new Date().toISOString(),
    roomType,
    style,
    stagingLevel,
    generationMode,
    customInstructions: promptPackage.customInstructions,
    status: "ready",
    fileName: image.name,
    fileSize: image.size,
    prompt: promptPackage.prompt,
    negativePrompt: promptPackage.negativePrompt
  };

  registerServerProject(project);

  return NextResponse.json({
    project,
    promptPackage,
    cloudinary: {
      originalPublicId: originalUpload?.public_id,
      stagedPublicId: stagedUpload?.public_id
    },
    message: "Render completed and saved."
  });
}

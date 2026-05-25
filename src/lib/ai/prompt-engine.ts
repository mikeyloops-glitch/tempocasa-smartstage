import {
  levelDescriptors,
  roomDescriptors,
  roomTypes,
  stagingLevels,
  stagingStyles,
  styleDescriptors
} from "@/lib/staging-options";
import type { GenerationMode, GeometryAnalysis, PromptMode, PromptPackage, RoomType, StagingLevel, StagingStyle } from "@/lib/types";

const preservationRules = [
  "Treat the uploaded image as the locked reference frame and preserve the same crop, aspect ratio, camera position, lens perspective, room proportions, and horizon lines.",
  "CAMERA LOCK: keep the exact same camera distance, angle, lens feel, horizon, vertical lines, framing, crop, visible edges, and aspect ratio. Do not zoom out, zoom in, tilt, pan, or make the room appear farther away.",
  "Preserve exact walls, windows, flooring, doors, door frames, handles, thresholds, ceiling height, ceiling plane, beams, architectural trim, structural columns, built-in openings, and natural lighting direction.",
  "DOOR AND WINDOW LOCK: do not change the type, shape, size, position, frame material, glazing, swing, opening, architrave, trim, or hardware of any door, window, shutter, balcony door, sliding door, interior opening, or exterior opening.",
  "FLOOR AND CEILING LOCK: keep the exact floor direction, tile or plank scale, ceiling lines, coves, beams, slopes, bulkheads, and visible edge positions.",
  "Preserve irregular architecture exactly: curved walls, angled walls, bay windows, non-square corners, sloped ceilings, alcoves, niches, diagonal partitions, and skewed perspective lines must keep their original shape and position.",
  "Preserve cabinetry, counters, appliances, plumbing fixtures, and built-ins only when the selected workflow is not explicitly removing them.",
  "Do not create new windows, remove windows, replace doors, move doors, move walls, square off curved or angled walls, straighten non-orthogonal corners, alter floor patterns, change ceiling shape, change camera angle, widen the room, add side borders, or distort architectural trim.",
  "Only modify the requested movable contents, furniture, decor, styling, or explicitly requested non-structural surface finish while keeping the original room shell aligned to the source photo.",
  "Add only believable real furniture or finishes with correct scale, contact shadows, and plausible placement.",
  "Maintain professional real-estate photography aesthetics with crisp textures and trustworthy listing-ready realism.",
  "Keep the output MLS-safe and commercially deployable for luxury property marketing."
];

const negativePromptItems = [
  "warped walls",
  "distorted geometry",
  "false columns",
  "fake columns",
  "decorative pillars",
  "cabinet side walls",
  "old cabinet remnants",
  "vertical cabinet slabs",
  "unrealistic scaling",
  "floating furniture",
  "blurry textures",
  "duplicate objects",
  "extra windows",
  "removed windows",
  "replaced doors",
  "changed door style",
  "changed door material",
  "different door",
  "different windows",
  "changed window frames",
  "moved window",
  "moved doorway",
  "fantasy architecture",
  "moved doors",
  "changed camera angle",
  "shifted crop",
  "zoomed out camera",
  "zoomed in camera",
  "changed focal length",
  "side borders",
  "squared off curved wall",
  "straightened angled wall",
  "flattened bay window",
  "lost alcove",
  "removed niche",
  "orthogonalized irregular room",
  "generic rectangular room",
  "changed flooring",
  "bent ceiling lines",
  "cartoon furniture",
  "overexposed windows",
  "inconsistent shadows",
  "leftover object fragments",
  "partial old cabinets",
  "fake reflections",
  "low resolution",
  "watermarks",
  "text overlays",
  "people"
];

const referenceLockRules = [
  "STRICT REFERENCE LOCK: the uploaded image is the source of truth, not inspiration.",
  "CAMERA LOCK: keep the exact same camera distance, angle, lens feel, horizon, vertical lines, crop, visible frame edges, and aspect ratio. Do not zoom out, zoom in, tilt, pan, or make the room appear farther away.",
  "Return the same room, same camera viewpoint, same camera distance, same crop, same visible frame edges, same aspect ratio, same perspective, same wall/floor/ceiling geometry, and same architectural layout.",
  "The generated image should behave like a precise duplicate plate of the uploaded shot with only the requested content changed.",
  "Do not reinterpret the space, rotate the camera, zoom in or out, crop differently, invent adjacent rooms, add openings, remove openings, change focal length, add side margins, or change the location of windows, doors, structural beams, structural columns, moulding, sockets, or floor direction.",
  "Doors and windows are protected architecture, not style elements. Keep every existing door, window, frame, shutter, threshold, glass panel, opening, trim, handle, and visible hardware exactly in place unless the user explicitly asks to edit only its color or finish.",
  "Wall color, wall texture, paint, plaster, or wallpaper may be adjusted only when requested, but the wall outline, corners, openings, trim, baseboards, floor line, ceiling line, and perspective must remain unchanged.",
  "IRREGULAR GEOMETRY LOCK: if the source photo contains curved walls, angled walls, slanted partitions, non-square corners, bay windows, alcoves, niches, partial-height walls, arched openings, diagonal ceiling planes, or asymmetrical room outlines, preserve those exact contours. Do not normalize the room into a rectangular box.",
  "Furniture and finishes must conform to the detected wall angles and curves: align sofas, counters, rugs, beds, cabinets, and decor to the original perspective and wall shape rather than forcing square showroom geometry.",
  "The output must line up with the uploaded before photo in a before/after comparison slider as closely as possible.",
  "If a requested change conflicts with preserving the reference image, preserve the reference image and apply the smallest realistic change possible."
];

function buildRoomSpecificInstruction(roomType: RoomType) {
  if (roomType === "Living Room + Kitchen") {
    return [
      "Open-plan living-kitchen instruction: preserve the exact open-plan architecture, visible kitchen footprint, living zone, window positions, floor direction, wall positions, camera angle, and natural light direction.",
      "Create a coherent lounge and kitchen relationship: proportionate sofa or seating, believable media or conversation zone, optional dining or island relationship only where the layout supports it, clean counters, integrated practical lighting, and uncluttered circulation.",
      "Do not block kitchen access, invent walls, move plumbing or appliances, add fake columns, or separate the open-plan space into impossible rooms."
    ].join(" ");
  }

  if (roomType === "Kitchen") {
    return [
      "Kitchen-specific instruction: preserve the existing kitchen footprint, wall positions, door positions, window positions, cabinet runs, appliance positions, floor, ceiling, camera angle, and lighting direction.",
      "Default staging should clean and style the kitchen with uncluttered counters, proportionate stools, dining pieces, decor, and practical lighting only where physically plausible.",
      "Do not remodel, replace, resize, move, or redesign kitchen cabinetry, doors, windows, counters, splashbacks, plumbing, appliances, or built-ins unless the user explicitly requests a custom renovation-style finish change."
    ].join(" ");
  }

  if (roomType === "Garden" || roomType === "Balcony / Terrace") {
    return [
      "Outdoor-specific instruction: preserve the existing exterior boundaries, railings, paving, garden layout, doors, windows, view direction, sun direction, and scale.",
      "Add only weather-appropriate furniture, planters, exterior lighting, and outdoor decor that physically fits the visible space.",
      "Keep paths, door swings, railings, steps, planting beds, and property edges unobstructed and believable."
    ].join(" ");
  }

  return "Stage the selected room type without changing the architectural shell.";
}

export function isRoomType(value: unknown): value is RoomType {
  return typeof value === "string" && roomTypes.includes(value as RoomType);
}

export function isStagingStyle(value: unknown): value is StagingStyle {
  return typeof value === "string" && stagingStyles.includes(value as StagingStyle);
}

export function isStagingLevel(value: unknown): value is StagingLevel {
  return typeof value === "string" && stagingLevels.includes(value as StagingLevel);
}

export function buildNegativePrompt() {
  return negativePromptItems.join(", ");
}

function normalizeCustomInstructions(value?: string | null) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 900) : "";
}

function normalizePromptMode(value?: string | null): PromptMode {
  return value === "custom" ? "custom" : "add-on";
}

function buildModeInstruction(mode: GenerationMode) {
  if (mode === "empty") {
    return [
      "Generation goal: create a completely empty clean-shell version of the submitted real-estate photo while matching the source photo exactly.",
      "Remove all visible room contents, furniture, clutter, rugs, plants, loose lighting, personal items, loose decor, freestanding cupboards, old cabinetry, kitchen cabinets, wardrobes, visible appliances, counters, shelving, and non-structural side panels.",
      "Reconstruct believable plain walls, flooring, ceiling, trim, shadows, and clean architectural surfaces where removed objects were hiding them.",
      "Do not add new furniture, cabinets, counters, appliances, decor, or styling. Leave only the empty room shell, clean, realistic, listing-ready, and aligned with the uploaded photo."
    ].join(" ");
  }

  if (mode === "custom") {
    return "Generation goal: follow the agent's custom instruction while treating the uploaded photo as an exact locked reference and producing a listing-ready result.";
  }

  return "Generation goal: virtually stage the submitted room with realistic furniture and decor while matching the uploaded photo's fixed room shell.";
}

function buildModeExecutionInstruction(mode: GenerationMode) {
  if (mode === "empty") {
    return [
      "Execution: remove all movable contents plus visible cupboards, wardrobes, old kitchen cabinetry, counters, shelving, visible appliances, non-structural side columns, decorative columns, panels, clutter, rugs, loose lighting, plants, and personal items.",
      "Reconstruct a clean empty shell: uninterrupted walls, continuous floor, ceiling, baseboards, shadowing, and realistic surfaces where objects were removed.",
      "If vertical columns, side returns, pilasters, cabinet side walls, or slab-like wall remnants are caused by removed cupboards or previous cabinetry, remove them completely and replace them with the continuous plain wall or floor that belongs behind them.",
      "Keep true structural architecture only: walls, windows, doors, load-bearing columns, ceiling, floor direction, camera angle, crop, and light direction.",
      "Do not leave cabinet fragments, side object remnants, appliance outlines, partial columns from removed furniture, floating edges, or ghost artifacts.",
      "Do not add furniture, televisions, rugs, lamps, plants, artwork, new cabinets, new counters, appliances, new windows, or decorative staging."
    ].join(" ");
  }

  if (mode === "custom") {
    return [
      "Execution: apply only the agent custom instruction.",
      "If the custom instruction asks for an exact duplicate, reference copy, no changes, or an empty reference copy, do not add furniture, televisions, rugs, plants, lamps, artwork, new finishes, or decorative staging.",
      "Only add furniture, finishes, styling, or decor when the custom instruction explicitly asks for those additions."
    ].join(" ");
  }

  return [
    "Execution: add premium furniture, realistic televisions where appropriate, carpets, decor, lighting fixtures, warm ambient accents, and physically believable shadows.",
    "Furniture must touch the floor, match the camera perspective, fit the room scale, and leave doors, windows, radiators, cabinetry, built-ins, and walkways plausible and visibly consistent.",
    "Do not remodel fixed architecture or fixed joinery during staging. Keep existing doors, windows, frames, ceiling, flooring, cabinet footprint, and built-in elements unchanged unless a custom prompt explicitly asks for a finish-only adjustment."
  ].join(" ");
}

function buildCustomInstructionBlock(input: {
  customInstructions: string;
  promptMode: PromptMode;
}) {
  if (!input.customInstructions) {
    return "";
  }

  if (input.promptMode === "custom") {
    return [
      `Custom prompt mode: ${input.customInstructions}.`,
      "Treat this as the primary edit instruction, but it must still obey the strict reference lock, architecture preservation, MLS safety, realism, and camera-lock rules.",
      "If the custom prompt requests wall color, paint, plaster, wallpaper, texture, or finish changes, apply them as surface-only edits: preserve wall shape, corners, baseboards, doors, windows, trim, floor line, ceiling line, shadows, and perspective.",
      "If the custom prompt asks for structural changes, new openings, different doors, different windows, a changed ceiling, changed floor direction, or a new room layout, reject that part implicitly and preserve the source architecture."
    ].join(" ");
  }

  return [
    `Add-on prompt for the selected setup: ${input.customInstructions}.`,
    "Use these notes only to refine the already selected room type, style, and staging level.",
    "Allowed add-on examples include wall color, surface texture, accent paint, textile color, furniture material, decor mood, lighting warmth, and styling preferences.",
    "Do not let add-on notes override the locked architecture, camera angle, room geometry, existing doors, windows, flooring, ceiling, structural trim, built-ins, or openings."
  ].join(" ");
}

function normalizeGeometryAnalysis(value?: GeometryAnalysis | null): GeometryAnalysis | undefined {
  if (!value) {
    return undefined;
  }

  return {
    hasIrregularGeometry: Boolean(value.hasIrregularGeometry),
    confidence: Math.max(0, Math.min(1, Number.isFinite(value.confidence) ? value.confidence : 0)),
    shapeSummary: value.shapeSummary.trim().replace(/\s+/g, " ").slice(0, 700),
    protectedArchitecture: value.protectedArchitecture.map((item) => item.trim()).filter(Boolean).slice(0, 10),
    stagingGuidance: value.stagingGuidance.map((item) => item.trim()).filter(Boolean).slice(0, 10),
    riskFlags: value.riskFlags.map((item) => item.trim()).filter(Boolean).slice(0, 8)
  };
}

function buildGeometryLockInstruction(geometryAnalysis?: GeometryAnalysis) {
  const geometry = normalizeGeometryAnalysis(geometryAnalysis);

  const baseRules = [
    "Before staging, inspect the source photo for irregular room geometry: angled walls, curved walls, bowed or rounded partitions, diagonal corners, bay windows, alcoves, niches, sloped ceilings, arched openings, and asymmetrical floor outlines.",
    "If any irregular geometry exists, preserve it exactly as the structural reference. The staged image must keep the same wall curvature, angle, corner position, floor boundary, ceiling line, and visible perspective.",
    "Do not simplify unusual walls into a flat rectangular room. Do not straighten, square off, widen, crop out, hide, or replace the irregular architecture.",
    "Place furniture around the original geometry with believable clearance and contact shadows. Furniture may follow curved or angled wall lines, but it must not cover the shape in a way that changes the room."
  ];

  if (!geometry) {
    return baseRules.join(" ");
  }

  const detectedRules = [
    `Geometry preflight: ${geometry.hasIrregularGeometry ? "irregular room geometry detected" : "no major irregular geometry detected, but preserve all observed contours"} with confidence ${geometry.confidence.toFixed(2)}.`,
    geometry.shapeSummary ? `Source shape summary: ${geometry.shapeSummary}.` : "",
    geometry.protectedArchitecture.length > 0 ? `Protected architecture to preserve exactly: ${geometry.protectedArchitecture.join("; ")}.` : "",
    geometry.stagingGuidance.length > 0 ? `Geometry-aware staging guidance: ${geometry.stagingGuidance.join("; ")}.` : "",
    geometry.riskFlags.length > 0 ? `Avoid these geometry failure modes: ${geometry.riskFlags.join("; ")}.` : ""
  ].filter(Boolean);

  return [...baseRules, ...detectedRules].join(" ");
}

function buildModeContext(input: {
  roomType: RoomType;
  style: StagingStyle;
  stagingLevel: StagingLevel;
  generationMode: GenerationMode;
}) {
  if (input.generationMode === "custom") {
    return [
      `Room type context: ${input.roomType}.`,
      `Style preference if explicitly requested: ${input.style}.`,
      `Intensity preference if explicitly requested: ${input.stagingLevel}.`
    ].join(" ");
  }

  if (input.generationMode === "empty") {
    return `Room type context: ${input.roomType}. Preserve the exact shot and room shell while removing all contents and built-in-looking visual clutter to create a clean empty space.`;
  }

  const room = roomDescriptors[input.roomType];
  const style = styleDescriptors[input.style];
  const level = levelDescriptors[input.stagingLevel];

  return [
    `Room type: ${input.roomType}. Create a ${room}.`,
    `Interior style: ${input.style}. Use ${style}.`,
    `Staging level: ${input.stagingLevel}. Apply ${level}.`,
    buildRoomSpecificInstruction(input.roomType)
  ].join(" ");
}

export function buildStagingPrompt(input: {
  roomType: RoomType;
  style: StagingStyle;
  stagingLevel: StagingLevel;
  generationMode?: GenerationMode;
  promptMode?: PromptMode | string | null;
  customInstructions?: string | null;
  geometryAnalysis?: GeometryAnalysis | null;
}) {
  const generationMode = input.generationMode ?? "stage";
  const promptMode = generationMode === "custom" ? "custom" : normalizePromptMode(input.promptMode);
  const customInstructions = normalizeCustomInstructions(input.customInstructions);
  const geometryAnalysis = normalizeGeometryAnalysis(input.geometryAnalysis);

  const prompt = [
    "Ultra realistic AI virtual staging for a luxury Italian real-estate listing.",
    referenceLockRules.join(" "),
    buildGeometryLockInstruction(geometryAnalysis),
    buildModeInstruction(generationMode),
    buildModeContext({ roomType: input.roomType, style: input.style, stagingLevel: input.stagingLevel, generationMode }),
    buildCustomInstructionBlock({ customInstructions, promptMode }),
    "Preserve the original camera and architecture exactly: walls, windows, flooring, doors, ceiling height, room proportions, camera lens perspective, crop, frame edges, and natural lighting direction.",
    "Edit the room intelligently through inpainting-style staging. Do not regenerate the room shell.",
    buildModeExecutionInstruction(generationMode),
    "Output should look like a commercial real-estate photograph for Tempocasa Immobiliare: efficient, trustworthy, architectural, and listing-ready.",
    `Negative constraints: ${buildNegativePrompt()}.`
  ].join(" ");

  return {
    prompt,
    negativePrompt: buildNegativePrompt(),
    preservationRules,
    roomType: input.roomType,
    style: input.style,
    stagingLevel: input.stagingLevel,
    generationMode,
    promptMode,
    customInstructions: customInstructions || undefined,
    geometryAnalysis
  } satisfies PromptPackage;
}

export function buildPromptPreview(input: {
  roomType?: string | null;
  style?: string | null;
  stagingLevel?: string | null;
  generationMode?: string | null;
  promptMode?: string | null;
  customInstructions?: string | null;
}) {
  const roomType = isRoomType(input.roomType) ? input.roomType : "Living Room";
  const style = isStagingStyle(input.style) ? input.style : "Luxury Modern";
  const stagingLevel = isStagingLevel(input.stagingLevel) ? input.stagingLevel : "Luxury";
  const generationMode = input.generationMode === "empty" || input.generationMode === "custom" ? input.generationMode : "stage";

  return buildStagingPrompt({ roomType, style, stagingLevel, generationMode, promptMode: input.promptMode, customInstructions: input.customInstructions });
}

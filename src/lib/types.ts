export type RoomType =
  | "Living Room"
  | "Lounge"
  | "Living Room + Kitchen"
  | "Bedroom"
  | "Kitchen"
  | "Bathroom"
  | "Studio Apartment"
  | "Dining Room"
  | "Home Office"
  | "Entryway"
  | "Balcony / Terrace"
  | "Garden";

export type StagingStyle =
  | "Luxury Modern"
  | "Scandinavian"
  | "Minimalist"
  | "Contemporary"
  | "Luxury Airbnb"
  | "Mediterranean"
  | "High-End Penthouse"
  | "Japandi"
  | "Outdoor Luxury"
  | "Family Rental Ready";

export type StagingLevel = "Light" | "Medium" | "Luxury";

export type GenerationMode = "stage" | "empty" | "custom";

export type PromptPackage = {
  prompt: string;
  negativePrompt: string;
  preservationRules: string[];
  roomType: RoomType;
  style: StagingStyle;
  stagingLevel: StagingLevel;
  generationMode: GenerationMode;
  customInstructions?: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  originalUrl: string;
  stagedUrl?: string;
  createdAt: string;
  roomType: RoomType;
  style: StagingStyle;
  stagingLevel: StagingLevel;
  generationMode?: GenerationMode;
  customInstructions?: string;
  status: "draft" | "processing" | "ready" | "configuration_required" | "failed";
  fileName?: string;
  fileSize?: number;
  prompt?: string;
  negativePrompt?: string;
};

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  kind: "original" | "empty" | "staged" | "panorama" | "tour" | "render";
  createdAt: string;
  projectId?: string;
  sourceProjectId?: string;
  sourceAssetId?: string;
  roomType?: RoomType;
  style?: StagingStyle;
  stagingLevel?: StagingLevel;
  generationMode?: GenerationMode;
  customInstructions?: string;
};

export type StagingApiResponse = {
  project: ProjectRecord;
  promptPackage: PromptPackage;
  cloudinary?: {
    originalPublicId?: string;
    stagedPublicId?: string;
  };
  message?: string;
};

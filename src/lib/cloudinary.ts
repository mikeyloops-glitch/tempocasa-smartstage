import { v2 as cloudinary } from "cloudinary";

type UploadResult = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
};

export function isCloudinaryConfigured() {
  const values = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET
  ];

  return values.every((value) => value && value !== "replace_me" && !value.includes("replace_me"));
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  return true;
}

export async function uploadBufferToCloudinary(input: {
  buffer: Buffer;
  folder?: string;
  fileName: string;
  contentType?: string;
  tags?: string[];
  context?: Record<string, string>;
}) {
  if (!configureCloudinary()) {
    return null;
  }

  const folder = input.folder ?? process.env.CLOUDINARY_UPLOAD_FOLDER ?? "tempocasa-smartstage";
  const dataUri = `data:${input.contentType ?? "image/png"};base64,${input.buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      public_id: input.fileName.replace(/\.[^/.]+$/, ""),
      resource_type: "image",
      overwrite: false,
      tags: input.tags,
      context: input.context
    });

    return result as UploadResult;
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return null;
  }
}

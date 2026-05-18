"use client";

import type { MediaAsset, ProjectRecord } from "@/lib/types";

const STORAGE_KEY = "tempocasa-smartstage.media";

function getGeneratedAssetKind(project: ProjectRecord): MediaAsset["kind"] {
  return project.generationMode === "empty" ? "empty" : "staged";
}

function getGeneratedAssetName(project: ProjectRecord) {
  return project.generationMode === "empty" ? `${project.name} - Empty Room` : `${project.name} - Staged`;
}

export function readMediaLibrary() {
  if (typeof window === "undefined") {
    return [] as MediaAsset[];
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as MediaAsset[]) : [];
  } catch {
    return [];
  }
}

export function saveMediaAsset(asset: MediaAsset) {
  const existing = readMediaLibrary().filter((item) => item.id !== asset.id);
  const next = [asset, ...existing].slice(0, 80);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeMediaAsset(assetId: string) {
  const next = readMediaLibrary().filter((item) => item.id !== assetId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveProjectMedia(project: ProjectRecord) {
  const now = new Date().toISOString();
  const assets: MediaAsset[] = [
    {
      id: `${project.id}-original`,
      name: `${project.name} - Before`,
      url: project.originalUrl,
      kind: "original",
      createdAt: now,
      projectId: project.id,
      roomType: project.roomType,
      style: project.style,
      stagingLevel: project.stagingLevel,
      generationMode: project.generationMode,
      customInstructions: project.customInstructions
    }
  ];

  if (project.stagedUrl) {
    assets.push({
      id: `${project.id}-${getGeneratedAssetKind(project)}`,
      name: getGeneratedAssetName(project),
      url: project.stagedUrl,
      kind: getGeneratedAssetKind(project),
      createdAt: now,
      projectId: project.id,
      sourceProjectId: project.id,
      roomType: project.roomType,
      style: project.style,
      stagingLevel: project.stagingLevel,
      generationMode: project.generationMode,
      customInstructions: project.customInstructions
    });
  }

  let library = readMediaLibrary();

  for (const asset of assets) {
    library = [asset, ...library.filter((item) => item.id !== asset.id)].slice(0, 80);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  return library;
}

"use client";

import type { ProjectRecord } from "@/lib/types";

const STORAGE_KEY = "tempocasa-smartstage.projects";

export function readProjects() {
  if (typeof window === "undefined") {
    return [] as ProjectRecord[];
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as ProjectRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: ProjectRecord) {
  const projects = readProjects().filter((item) => item.id !== project.id);
  const next = [project, ...projects].slice(0, 30);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearProjects() {
  window.localStorage.removeItem(STORAGE_KEY);
}

import type { ProjectRecord } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __tempocasaSmartstageProjects: ProjectRecord[] | undefined;
}

export function getServerProjects() {
  globalThis.__tempocasaSmartstageProjects ??= [];
  return globalThis.__tempocasaSmartstageProjects;
}

export function registerServerProject(project: ProjectRecord) {
  const projects = getServerProjects();
  const next = [project, ...projects.filter((item) => item.id !== project.id)].slice(0, 50);
  globalThis.__tempocasaSmartstageProjects = next;
  return project;
}

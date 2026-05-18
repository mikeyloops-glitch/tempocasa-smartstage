/* eslint-disable @next/next/no-img-element */
"use client";

import { Clock3, ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { ProjectRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type RecentProjectsProps = {
  projects: ProjectRecord[];
  activeProjectId?: string;
  onSelect: (project: ProjectRecord) => void;
};

export function RecentProjects({ projects, activeProjectId, onSelect }: RecentProjectsProps) {
  const { t, labelRoom, labelStyle, labelLevel, labelStatus } = useLanguage();

  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-silver-200 bg-white p-6 text-center shadow-panel">
        <div className="mx-auto grid size-12 place-items-center rounded-md bg-silver-100 text-navy-950">
          <ImageIcon className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-semibold text-navy-950">{t("recent.emptyTitle")}</p>
        <p className="mt-2 text-sm leading-6 text-charcoal-800">
          {t("recent.emptyBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          aria-pressed={activeProjectId === project.id}
          data-active={activeProjectId === project.id ? "true" : undefined}
          className={[
            "interactive-surface w-full rounded-md border bg-white p-3 text-left shadow-panel hover:border-silver-300",
            activeProjectId === project.id ? "control-selected border-navy-950" : "border-silver-200"
          ].join(" ")}
          onClick={() => onSelect(project)}
        >
          <div className="flex gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-silver-100">
              <img
                src={project.stagedUrl ?? project.originalUrl}
                alt={project.name}
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="fit-label line-clamp-2 text-sm font-semibold text-navy-950">{project.name}</p>
                <span className="shrink-0 rounded-sm bg-silver-100 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-charcoal-800 sm:tracking-[0.14em]">
                  {labelStatus(project.status)}
                </span>
              </div>
              <p className="fit-label mt-1 text-xs text-charcoal-800">
                {labelRoom(project.roomType)} / {labelStyle(project.style)} / {labelLevel(project.stagingLevel)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-charcoal-800">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {formatDate(project.createdAt)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

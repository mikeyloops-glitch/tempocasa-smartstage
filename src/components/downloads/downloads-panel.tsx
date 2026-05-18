"use client";

import { Download, FileDown, ImageDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import type { ProjectRecord } from "@/lib/types";

export function DownloadsPanel({
  project,
  onSaveToMedia
}: {
  project: ProjectRecord | null;
  onSaveToMedia?: (project: ProjectRecord) => void;
}) {
  const { t, labelRoom, labelStyle, labelLevel } = useLanguage();
  const isReady = Boolean(project?.stagedUrl);
  const canSave = Boolean(project?.originalUrl || project?.stagedUrl);

  return (
    <section className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-navy-950">{t("downloads.title")}</h3>
          <p className="mt-1 text-sm text-charcoal-800">{t("downloads.body")}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-md bg-navy-950 text-white">
          <FileDown className="size-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button asChild disabled={!isReady} variant={isReady ? "primary" : "secondary"} className={!isReady ? "pointer-events-none" : ""}>
          <a href={project?.stagedUrl ?? "#"} download={`${project?.name ?? "smartstage-render"}.png`}>
            <ImageDown className="size-4" aria-hidden="true" />
            <span className="fit-label">{t("downloads.hd")}</span>
          </a>
        </Button>
        <Button asChild disabled={!isReady} variant="secondary" className={!isReady ? "pointer-events-none" : ""}>
          <a href={project?.stagedUrl ?? "#"} download={`${project?.name ?? "smartstage-listing"}.png`}>
            <Download className="size-4" aria-hidden="true" />
            <span className="fit-label">{t("downloads.listing")}</span>
          </a>
        </Button>
      </div>
      <Button
        className="mt-3 w-full"
        disabled={!canSave || !project}
        onClick={() => {
          if (project) {
            onSaveToMedia?.(project);
          }
        }}
        variant="secondary"
      >
        <Save className="size-4" aria-hidden="true" />
        <span className="fit-label">{t("downloads.save")}</span>
      </Button>

      {project ? (
        <div className="mt-5 rounded-md bg-silver-50 p-4 text-sm leading-6 text-charcoal-800">
          <p className="fit-label font-semibold text-navy-950">{project.name}</p>
          <p>
            {labelRoom(project.roomType)} / {labelStyle(project.style)} / {labelLevel(project.stagingLevel)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

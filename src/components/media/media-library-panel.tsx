/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { Download, FolderOpen, ImageIcon, RotateCcw, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildDownloadUrl } from "@/lib/download-url";
import { useLanguage } from "@/lib/i18n";
import type { GenerationMode, MediaAsset } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type MediaLibraryPanelProps = {
  assets: MediaAsset[];
  onRemove: (assetId: string) => void;
  onUseAsInput: (asset: MediaAsset, mode?: GenerationMode) => void;
};

type MediaFolder = "all" | "original" | "empty" | "staged" | "panorama" | "tour";

const folders: MediaFolder[] = ["all", "original", "empty", "staged", "panorama", "tour"];

function normalizeFolderKind(kind: MediaAsset["kind"]): Exclude<MediaFolder, "all"> {
  return kind === "render" ? "staged" : kind;
}

function getPrimaryAction(asset: MediaAsset): { key: string; mode?: GenerationMode } {
  const kind = normalizeFolderKind(asset.kind);

  if (kind === "original") {
    return { key: "media.action.empty", mode: "empty" };
  }

  if (kind === "empty") {
    return { key: "media.action.stage", mode: "stage" };
  }

  return { key: "media.action.use", mode: "custom" };
}

export function MediaLibraryPanel({ assets, onRemove, onUseAsInput }: MediaLibraryPanelProps) {
  const { t } = useLanguage();
  const [activeFolder, setActiveFolder] = useState<MediaFolder>("all");

  const folderCounts = useMemo(() => {
    return folders.reduce<Record<MediaFolder, number>>(
      (counts, folder) => {
        counts[folder] =
          folder === "all"
            ? assets.length
            : assets.filter((asset) => normalizeFolderKind(asset.kind) === folder).length;
        return counts;
      },
      { all: 0, original: 0, empty: 0, staged: 0, panorama: 0, tour: 0 }
    );
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (activeFolder === "all") {
      return assets;
    }

    return assets.filter((asset) => normalizeFolderKind(asset.kind) === activeFolder);
  }, [activeFolder, assets]);

  return (
    <section id="media-library" className="scroll-mt-20 rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:scroll-mt-24 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-champagne-500 sm:text-xs sm:tracking-[0.2em]">{t("media.kicker")}</p>
          <h2 className="mt-2 text-xl font-semibold text-navy-950 sm:text-2xl">{t("media.title")}</h2>
        </div>
        <div className="grid size-10 place-items-center rounded-md bg-navy-950 text-white">
          <ImageIcon className="size-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {folders.map((folder) => {
          const selected = folder === activeFolder;

          return (
            <button
              key={folder}
              type="button"
              aria-pressed={selected}
              data-active={selected ? "true" : undefined}
              className={[
                "interactive-surface flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold leading-tight",
                selected
                  ? "control-selected border-navy-950 bg-navy-950 text-white"
                  : "border-silver-200 bg-white text-charcoal-900 hover:border-silver-300 hover:bg-silver-50"
              ].join(" ")}
              onClick={() => setActiveFolder(folder)}
            >
              <FolderOpen className="size-4" aria-hidden="true" />
              {t(`media.folder.${folder}`)}
              <span className={selected ? "text-silver-200" : "text-charcoal-600"}>{folderCounts[folder]}</span>
            </button>
          );
        })}
      </div>

      {assets.length === 0 ? (
        <div className="rounded-md border border-silver-200 bg-silver-50 p-6 text-center">
          <p className="text-sm font-semibold text-navy-950">{t("media.emptyTitle")}</p>
          <p className="mt-2 text-sm leading-6 text-charcoal-800">
            {t("media.emptyBody")}
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-md border border-silver-200 bg-silver-50 p-6 text-center">
          <p className="text-sm font-semibold text-navy-950">{t("media.emptyFolderTitle")}</p>
          <p className="mt-2 text-sm leading-6 text-charcoal-800">{t("media.emptyFolderBody")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredAssets.map((asset) => {
            const action = getPrimaryAction(asset);
            const kind = normalizeFolderKind(asset.kind);

            return (
              <article key={asset.id} className="overflow-hidden rounded-md border border-silver-200 bg-white">
                <div className="relative aspect-[4/3] overflow-hidden bg-silver-100">
                  <img src={asset.url} alt={asset.name} className="size-full object-cover" loading="lazy" />
                  <span className="absolute left-2 top-2 rounded-sm bg-white/90 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-navy-950 shadow-panel">
                    {t(`media.kind.${normalizeFolderKind(asset.kind)}`)}
                  </span>
                </div>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="fit-label line-clamp-2 text-sm font-semibold text-navy-950">{asset.name}</p>
                    <p className="mt-1 text-xs text-charcoal-800">{formatDate(asset.createdAt)}</p>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                    <Button size="sm" variant={kind === "empty" ? "primary" : "secondary"} className="min-w-0" onClick={() => onUseAsInput(asset, action.mode)}>
                      {kind === "empty" ? <Sparkles className="size-4" aria-hidden="true" /> : kind === "original" ? <Wand2 className="size-4" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
                      <span className="fit-label">{t(action.key)}</span>
                    </Button>
                    <Button asChild size="icon" variant="ghost" aria-label={`Download ${asset.name}`}>
                      <a href={buildDownloadUrl(asset.url, `${asset.name}.png`)} download={`${asset.name}.png`}>
                        <Download className="size-4" aria-hidden="true" />
                      </a>
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Remove ${asset.name}`} onClick={() => onRemove(asset.id)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

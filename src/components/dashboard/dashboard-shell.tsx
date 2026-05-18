/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Building2,
  Download,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  Library,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Wand2
} from "lucide-react";
import { TempoCasaLogo } from "@/components/brand/tempocasa-logo";
import { DownloadsPanel } from "@/components/downloads/downloads-panel";
import { MediaLibraryPanel } from "@/components/media/media-library-panel";
import { RecentProjects } from "@/components/projects/recent-projects";
import { BeforeAfterSlider } from "@/components/staging/before-after-slider";
import { StagingControls } from "@/components/staging/staging-controls";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/upload/image-uploader";
import { buildPromptPreview } from "@/lib/ai/prompt-engine";
import { isClerkConfigured } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { readMediaLibrary, removeMediaAsset, saveProjectMedia } from "@/lib/media-library";
import { readProjects, saveProject } from "@/lib/projects";
import type {
  GenerationMode,
  MediaAsset,
  ProjectRecord,
  RoomType,
  StagingApiResponse,
  StagingLevel,
  StagingStyle
} from "@/lib/types";

const navigation = [
  { labelKey: "nav.newProject", shortLabelKey: "nav.new", icon: Plus, href: "#new-project" },
  { labelKey: "nav.recentProjects", shortLabelKey: "nav.projects", icon: FolderOpen, href: "#recent-projects" },
  { labelKey: "nav.aiGenerate", shortLabelKey: "nav.ai", icon: Wand2, href: "#ai-generate" },
  { labelKey: "nav.mediaLibrary", shortLabelKey: "nav.media", icon: ImageIcon, href: "#media-library" },
  { labelKey: "nav.propertyLibrary", shortLabelKey: "nav.library", icon: Library, href: "#property-library" },
  { labelKey: "nav.downloads", shortLabelKey: "nav.files", icon: Download, href: "#downloads" }
];

const libraryItems = [
  {
    name: "Brera Residence",
    locationKey: "property.breraLocation",
    image: "/assets/smartstage-demo-after.png",
    roomsKey: "property.breraRooms"
  },
  {
    name: "Navigli Rental",
    locationKey: "property.navigliLocation",
    image: "/assets/smartstage-demo-before.png",
    roomsKey: "property.studio"
  },
  {
    name: "Porta Nuova Penthouse",
    locationKey: "property.penthouseLocation",
    image: "/assets/smartstage-hero.png",
    roomsKey: "property.sixRooms"
  }
];

export function DashboardShell() {
  if (isClerkConfigured()) {
    return <AuthenticatedDashboardShell />;
  }

  return <DashboardContent userName="Demo" userControl={<DemoUserBadge />} />;
}

function AuthenticatedDashboardShell() {
  const { user } = useUser();
  const name = user?.firstName ?? user?.fullName?.split(" ")[0];

  return <DashboardContent userName={name} userControl={<UserButton afterSignOutUrl="/" />} />;
}

function DemoUserBadge() {
  const { t } = useLanguage();

  return (
    <div className="grid size-10 place-items-center rounded-full bg-navy-950 text-sm font-semibold text-white" title={t("app.demoMode")}>
      D
    </div>
  );
}

function AwaitingAfterPreview({
  beforeSrc,
  canGenerate,
  configurationDirty,
  hasRoomImage,
  isGenerating,
  projectStatus,
  onGenerate
}: {
  beforeSrc: string;
  canGenerate: boolean;
  configurationDirty: boolean;
  hasRoomImage: boolean;
  isGenerating: boolean;
  projectStatus?: ProjectRecord["status"];
  onGenerate: () => void;
}) {
  const { t } = useLanguage();
  const statusText = useMemo(() => {
    if (isGenerating || projectStatus === "processing") {
      return t("preview.status.generating");
    }

    if (projectStatus === "configuration_required") {
      return t("preview.status.configureOpenAI");
    }

    if (configurationDirty) {
      return t("preview.status.dirty");
    }

    if (!hasRoomImage) {
      return t("preview.status.noImage");
    }

    return t("preview.status.ready");
  }, [configurationDirty, hasRoomImage, isGenerating, projectStatus, t]);

  return (
    <div className="relative overflow-hidden rounded-md border border-white/20 bg-charcoal-950 shadow-soft">
      <div className="relative aspect-[4/5] w-full bg-charcoal-950 sm:aspect-[16/10]">
        <img
          src={beforeSrc}
          alt={t("preview.beforeAlt")}
          className="absolute inset-0 size-full object-contain object-center"
          draggable={false}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,20,24,0)_0%,rgba(17,20,24,0)_48%,rgba(17,20,24,0.82)_66%,rgba(17,20,24,0.94)_100%)]" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/80 shadow-[0_0_0_1px_rgba(17,20,24,0.18)]" aria-hidden="true" />
        <div className="absolute bottom-3 left-3 rounded-sm bg-charcoal-950/72 px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-champagne-300 sm:bottom-4 sm:left-4 sm:px-3 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.16em]">
          {t("preview.before")}
        </div>
        <div className="absolute bottom-3 right-3 rounded-sm bg-white/90 px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-navy-950 sm:bottom-4 sm:right-4 sm:px-3 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.16em]">
          {t("preview.after")}
        </div>
        <div className="absolute inset-x-3 top-3 rounded-md border border-white/15 bg-charcoal-950/86 p-3 text-white backdrop-blur-md sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(260px,44%)] sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagne-300">{t("preview.pending")}</p>
          <p className="mt-2 text-sm leading-6 text-silver-100">{statusText}</p>
          <Button className="mt-4 w-full bg-white text-navy-950 hover:bg-silver-100" disabled={!canGenerate} onClick={onGenerate}>
            {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
            <span className="fit-label">{isGenerating ? t("button.generating") : configurationDirty ? t("button.applyGenerate") : t("button.generate")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const generationModes: Array<{ value: GenerationMode }> = [{ value: "stage" }, { value: "empty" }, { value: "custom" }];
const stagingRequestTimeoutMs = 70_000;

function safeUploadFileName(name: string, fallback: string) {
  const fallbackParts = fallback.match(/^(.+?)(\.[a-z0-9]+)$/i);
  const fallbackStem = fallbackParts?.[1] ?? "room-image";
  const fallbackExtension = fallbackParts?.[2] ?? ".jpg";
  const matchedExtension = name.match(/\.(jpe?g|png|webp)$/i)?.[0].toLowerCase() ?? fallbackExtension;
  const stem =
    name
      .replace(/\.[^/.]+$/, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 64) || fallbackStem;

  return `${stem}${matchedExtension}`;
}

async function readStagingResponse(
  response: Response,
  messages: {
    timeout: string;
    server: string;
    fallback: string;
  }
) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as Partial<StagingApiResponse> & { message?: string };

    if (!response.ok && response.status !== 202) {
      throw new Error(data.message ?? messages.fallback);
    }

    if (!data.project || !data.promptPackage) {
      throw new Error(messages.server);
    }

    return data as StagingApiResponse;
  }

  const bodyText = await response.text().catch(() => "");

  if (response.status === 504 || /timeout|timed out|FUNCTION_INVOCATION_TIMEOUT/i.test(bodyText)) {
    throw new Error(messages.timeout);
  }

  throw new Error(response.ok ? messages.server : messages.fallback);
}

function DashboardContent({ userName, userControl }: { userName?: string; userControl: ReactNode }) {
  const { t, labelRoom, labelStyle, labelLevel } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType>("Living Room");
  const [style, setStyle] = useState<StagingStyle>("Luxury Modern");
  const [stagingLevel, setStagingLevel] = useState<StagingLevel>("Luxury");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("stage");
  const [customInstructions, setCustomInstructions] = useState("");
  const [appliedConfig, setAppliedConfig] = useState<{
    roomType: RoomType;
    style: StagingStyle;
    stagingLevel: StagingLevel;
    generationMode: GenerationMode;
    customInstructions: string;
  }>({
    roomType: "Living Room",
    style: "Luxury Modern",
    stagingLevel: "Luxury",
    generationMode: "stage",
    customInstructions: ""
  });
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeHash, setActiveHash] = useState("#new-project");

  useEffect(() => {
    const stored = readProjects();
    setProjects(stored);
    setMediaAssets(readMediaLibrary());
  }, []);

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash || "#new-project");
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const configurationDirty =
    roomType !== appliedConfig.roomType ||
    style !== appliedConfig.style ||
    stagingLevel !== appliedConfig.stagingLevel ||
    generationMode !== appliedConfig.generationMode ||
    customInstructions.trim() !== appliedConfig.customInstructions;
  const previewBefore = previewUrl ?? activeProject?.originalUrl ?? "/assets/smartstage-demo-before.png";
  const stagedPreviewUrl = imageFile && configurationDirty ? null : activeProject?.stagedUrl;
  const previewAfter = stagedPreviewUrl ?? (!previewUrl && !activeProject ? "/assets/smartstage-demo-after.png" : null);
  const canGenerate = Boolean(imageFile) && !isGenerating;
  const hasRoomImage = Boolean(imageFile || activeProject?.originalUrl || previewUrl);
  const selectedGenerationMode = generationModes.find((mode) => mode.value === generationMode) ?? generationModes[0];
  const generateLabel = configurationDirty ? t("button.applyGenerate") : t("button.generate");

  const greeting = useMemo(() => {
    return userName ? t("dashboard.greeting", { name: userName }) : t("dashboard.greetingGeneric");
  }, [t, userName]);

  function handleRoomImageChange(file: File | null) {
    setImageFile(file);
    setNotice(null);
    setActiveProject(null);

    if (!file) {
      setMaskFile(null);
    }
  }

  function handleShowDemo() {
    setImageFile(null);
    setMaskFile(null);
    setActiveProject(null);
    setNotice(t("notice.demoRestored"));
  }

  function handleProjectSelect(project: ProjectRecord) {
    setImageFile(null);
    setMaskFile(null);
    setNotice(null);
    setActiveProject(project);
    setRoomType(project.roomType);
    setStyle(project.style);
    setStagingLevel(project.stagingLevel);
    setGenerationMode(project.generationMode ?? "stage");
    setCustomInstructions(project.customInstructions ?? "");
    setAppliedConfig({
      roomType: project.roomType,
      style: project.style,
      stagingLevel: project.stagingLevel,
      generationMode: project.generationMode ?? "stage",
      customInstructions: project.customInstructions ?? ""
    });
  }

  function handleApplyConfiguration() {
    const nextConfig = { roomType, style, stagingLevel, generationMode, customInstructions: customInstructions.trim() };
    setAppliedConfig(nextConfig);

    if (imageFile) {
      setActiveProject(null);
      setNotice(t("notice.configAppliedImage", { mode: nextConfig.generationMode === "empty" ? t("mode.empty.label") : "AI" }));
      return;
    }

    setNotice(t("notice.configApplied", {
      roomType: labelRoom(nextConfig.roomType),
      style: labelStyle(nextConfig.style),
      stagingLevel: labelLevel(nextConfig.stagingLevel)
    }));
  }

  function handleSaveToMedia(project: ProjectRecord) {
    setMediaAssets(saveProjectMedia(project));
    setNotice(project.generationMode === "empty" ? t("notice.savedEmpty") : t("notice.savedStaged"));
  }

  function handleRemoveMedia(assetId: string) {
    setMediaAssets(removeMediaAsset(assetId));
  }

  async function handleUseMediaAsInput(asset: MediaAsset, mode?: GenerationMode) {
    try {
      const response = await fetch(asset.url);

      if (!response.ok) {
        throw new Error("Saved image could not be opened.");
      }

      const blob = await response.blob();
      const file = new File([blob], `${asset.name.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)+/g, "") || "media-image"}.png`, {
        type: blob.type || "image/png",
        lastModified: Date.now()
      });

      const nextRoomType = asset.roomType ?? roomType;
      const nextStyle = asset.style ?? style;
      const nextStagingLevel = asset.stagingLevel ?? stagingLevel;
      const nextGenerationMode = mode ?? asset.generationMode ?? (asset.kind === "empty" ? "stage" : "custom");
      const nextInstructions = "";

      handleRoomImageChange(file);
      setRoomType(nextRoomType);
      setStyle(nextStyle);
      setStagingLevel(nextStagingLevel);
      setGenerationMode(nextGenerationMode);
      setCustomInstructions(nextInstructions);
      setAppliedConfig({
        roomType: nextRoomType,
        style: nextStyle,
        stagingLevel: nextStagingLevel,
        generationMode: nextGenerationMode,
        customInstructions: nextInstructions
      });
      window.location.hash = "#ai-generate";
      setNotice(
        nextGenerationMode === "stage"
          ? t("notice.loadedStage", { name: asset.name })
          : nextGenerationMode === "empty"
            ? t("notice.loadedEmpty", { name: asset.name })
            : t("notice.loadedCustom", { name: asset.name })
      );
    } catch {
      setNotice(t("notice.reuseFailed"));
    }
  }

  async function handleGenerate() {
    if (!imageFile) {
      setNotice(t("notice.uploadFirst"));
      return;
    }

    setIsGenerating(true);
    setNotice(null);
    const runConfig = {
      roomType,
      style,
      stagingLevel,
      generationMode,
      customInstructions: customInstructions.trim()
    };
    const runPromptPackage = buildPromptPreview(runConfig);

    setAppliedConfig(runConfig);

    const activeRoomType = runConfig.roomType;
    const activeStyle = runConfig.style;
    const activeStagingLevel = runConfig.stagingLevel;
    const activeGenerationMode = runConfig.generationMode;
    const activeCustomInstructions = runConfig.customInstructions;

    const processingProject: ProjectRecord = {
      id: `processing-${Date.now()}`,
      name: imageFile.name.replace(/\.[^/.]+$/, "") || "AI SmartStage project",
      originalUrl: previewUrl ?? "/assets/smartstage-demo-before.png",
      createdAt: new Date().toISOString(),
      roomType: activeRoomType,
      style: activeStyle,
      stagingLevel: activeStagingLevel,
      generationMode: activeGenerationMode,
      customInstructions: activeCustomInstructions || undefined,
      status: "processing",
      fileName: imageFile.name,
      fileSize: imageFile.size,
      prompt: runPromptPackage.prompt,
      negativePrompt: runPromptPackage.negativePrompt
    };

    setActiveProject(processingProject);

    try {
      const formData = new FormData();
      formData.append("image", imageFile, safeUploadFileName(imageFile.name, "room-image.jpg"));
      if (maskFile) {
        formData.append("mask", maskFile, safeUploadFileName(maskFile.name, "mask.png"));
      }
      formData.append("roomType", activeRoomType);
      formData.append("style", activeStyle);
      formData.append("stagingLevel", activeStagingLevel);
      formData.append("generationMode", activeGenerationMode);
      formData.append("customInstructions", activeCustomInstructions);
      formData.append("projectName", processingProject.name);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), stagingRequestTimeoutMs);
      let response: Response;
      try {
        response = await fetch("/api/stage", {
          method: "POST",
          body: formData,
          signal: controller.signal
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = await readStagingResponse(response, {
        timeout: t("notice.generationTimeout"),
        server: t("notice.generationServer"),
        fallback: t("notice.stagingFailed")
      });

      setActiveProject(data.project);
      const next = saveProject(data.project);
      setProjects(next);
      if (data.project.stagedUrl) {
        setMediaAssets(saveProjectMedia(data.project));
      }
      setNotice(
        data.project.generationMode === "empty"
          ? t("notice.emptySaved")
          : t("notice.stagedSaved")
      );
    } catch (error) {
      const failedProject: ProjectRecord = {
        ...processingProject,
        status: "failed"
      };
      setActiveProject(failedProject);
      if (error instanceof DOMException && error.name === "AbortError") {
        setNotice(t("notice.generationTimeout"));
      } else if (error instanceof TypeError) {
        setNotice(t("notice.generationNetwork"));
      } else if (error instanceof Error && /string did not match the expected pattern/i.test(error.message)) {
        setNotice(t("notice.generationServer"));
      } else {
        setNotice(error instanceof Error ? error.message : t("notice.stagingFailed"));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-silver-50 pb-28 text-charcoal-950 sm:pb-32 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-silver-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
          <Link href="/" aria-label="TEMPOCASA SMARTSTAGE home" className="min-w-0">
            <TempoCasaLogo className="hidden text-navy-950 sm:flex" />
            <TempoCasaLogo className="text-navy-950 sm:hidden" markOnly />
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/">
                <Building2 className="size-4" aria-hidden="true" />
                {t("app.landing")}
              </Link>
            </Button>
            {userControl}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-silver-200 bg-white/95 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_38px_rgba(17,20,24,0.10)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-6 gap-1 px-1 pb-1">
          {navigation.map((item) => {
            const selected = activeHash === item.href;
            const label = t(item.labelKey);

            return (
              <a
                key={item.labelKey}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                aria-label={label}
                data-active={selected ? "true" : undefined}
                className={[
                  "interactive-surface inline-flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border px-0.5 py-2 text-center text-[0.68rem] font-semibold leading-tight sm:min-h-12 sm:gap-1 sm:px-1.5 sm:text-xs",
                  selected
                    ? "control-selected border-navy-950 bg-navy-950 text-white"
                    : "border-silver-200 bg-white text-charcoal-800 hover:border-silver-300 hover:bg-silver-50 hover:text-navy-950"
                ].join(" ")}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="fit-label line-clamp-2">{t(item.shortLabelKey)}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto grid max-w-[1480px] gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[248px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-2 rounded-md border border-silver-200 bg-white p-3 shadow-panel">
            {navigation.map((item) => (
              <a
                key={item.labelKey}
                href={item.href}
                aria-current={activeHash === item.href ? "page" : undefined}
                data-active={activeHash === item.href ? "true" : undefined}
                className={[
                  "interactive-surface flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium leading-tight",
                  activeHash === item.href
                    ? "control-selected bg-navy-950 text-white"
                    : "text-charcoal-800 hover:bg-silver-50 hover:text-navy-950"
                ].join(" ")}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="fit-label">{t(item.labelKey)}</span>
              </a>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="rounded-md bg-navy-950 p-4 text-white shadow-soft sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-champagne-300 sm:text-xs sm:tracking-[0.28em]">
                  {t("dashboard.kicker")}
                </p>
                <h1 className="mt-3 font-display text-3xl leading-tight tracking-normal sm:text-5xl">{greeting}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-silver-100">
                  {t("dashboard.subtitle")}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
                {[
                  ["24", t("dashboard.stats.active")],
                  ["98%", t("dashboard.stats.ready")],
                  ["4K", t("dashboard.stats.export")]
                ].map(([value, label]) => (
                  <div key={label} className="min-w-0 rounded-md border border-white/20 bg-white/10 px-2 py-3 sm:px-4">
                    <p className="font-display text-2xl sm:text-3xl">{value}</p>
                    <p className="fit-label mt-1 text-[0.62rem] uppercase tracking-[0.1em] text-silver-100 sm:text-xs sm:tracking-[0.18em]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="new-project" className="grid min-w-0 scroll-mt-24 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.62fr)]">
            <section id="ai-generate" className="min-w-0 scroll-mt-20 rounded-md border border-silver-200 bg-white p-3 shadow-panel sm:scroll-mt-24 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne-500 sm:tracking-[0.2em]">{t("section.newProject")}</p>
                  <h2 className="mt-2 text-xl font-semibold text-navy-950 sm:text-2xl">{t("section.aiGenerate")}</h2>
                </div>
                <Button className="w-full sm:w-auto" onClick={handleGenerate} disabled={!canGenerate}>
                  {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                  <span className="fit-label">{isGenerating ? t("button.generating") : generateLabel}</span>
                </Button>
              </div>

              <div className="mt-5 grid min-w-0 gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                  <ImageUploader
                    label={t("upload.roomLabel")}
                    helper={t("upload.roomHelper")}
                    file={imageFile}
                    onChange={handleRoomImageChange}
                    enableCamera
                    normalizeToJpeg
                  />
                  <ImageUploader
                    label={t("upload.maskLabel")}
                    helper={t("upload.maskHelper")}
                    file={maskFile}
                    onChange={setMaskFile}
                    compact
                  />
                </div>
                <div className="min-w-0 space-y-6">
                  <StagingControls
                    roomType={roomType}
                    style={style}
                    stagingLevel={stagingLevel}
                    isConfigurationDirty={configurationDirty}
                    onRoomTypeChange={setRoomType}
                    onStyleChange={setStyle}
                    onStagingLevelChange={setStagingLevel}
                    onApplyConfiguration={handleApplyConfiguration}
                  />
                  <section className="space-y-4 rounded-md border border-silver-200 bg-silver-50 p-3 sm:p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-500 sm:tracking-[0.18em]">{t("ai.direction")}</p>
                      <h3 className="mt-1 text-base font-semibold text-navy-950">{t("ai.generationMode")}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {generationModes.map((mode) => {
                        const selected = mode.value === generationMode;

                        return (
                          <button
                            key={mode.value}
                            type="button"
                            aria-pressed={selected}
                            data-active={selected ? "true" : undefined}
                            className={[
                              "interactive-surface flex min-h-14 min-w-0 items-center justify-center rounded-md border px-3 py-3 text-center text-base font-semibold leading-tight sm:min-h-12 sm:py-2 sm:text-sm",
                              selected
                                ? "control-selected border-navy-950 bg-navy-950 text-white"
                                : "border-silver-200 bg-white text-charcoal-900 hover:border-silver-300"
                            ].join(" ")}
                            onClick={() => setGenerationMode(mode.value)}
                          >
                            <span className="fit-label">{t(`mode.${mode.value}.label`)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="rounded-md border border-silver-200 bg-white px-3 py-2 text-xs leading-5 text-charcoal-800">
                      {t(`mode.${selectedGenerationMode.value}.description`)}
                    </p>
                    <label className="block">
                      <span className="text-sm font-semibold text-navy-950">{t("ai.optionalPrompt")}</span>
                      <textarea
                        className="mt-2 min-h-28 w-full resize-y rounded-md border border-silver-200 bg-white px-3 py-3 text-base leading-7 text-charcoal-950 outline-none transition focus:border-navy-950 focus:ring-2 focus:ring-champagne-300 sm:text-sm sm:leading-6"
                        maxLength={900}
                        placeholder={t("ai.promptPlaceholder")}
                        value={customInstructions}
                        onChange={(event) => setCustomInstructions(event.target.value)}
                      />
                      <span className="mt-2 block text-sm leading-6 text-charcoal-800 sm:text-xs sm:leading-5">
                        {t("ai.promptHelp")}
                      </span>
                    </label>
                    <div className="rounded-md border border-silver-200 bg-white p-3">
                      <Button className="w-full" onClick={handleGenerate} disabled={!canGenerate}>
                        {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                        <span className="fit-label">{isGenerating ? t("button.generating") : generateLabel}</span>
                      </Button>
                      <p className="mt-2 text-sm leading-6 text-charcoal-800 sm:text-xs sm:leading-5">
                        {t("ai.generateHelp")}
                      </p>
                    </div>
                  </section>
                </div>
              </div>
              {notice ? (
                <div className="mt-5 rounded-md border border-champagne-300 bg-champagne-100 px-4 py-3 text-sm text-charcoal-900">
                  {notice}
                </div>
              ) : null}
            </section>

            <section className="min-w-0 space-y-4 2xl:sticky 2xl:top-24 2xl:self-start">
              <div className="rounded-md border border-silver-200 bg-white p-3 shadow-panel sm:p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-champagne-500 sm:text-xs sm:tracking-[0.2em]">{t("preview.kicker")}</p>
                    <h2 className="mt-1 text-lg font-semibold text-navy-950 sm:text-xl">{t("preview.title")}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {(imageFile || activeProject) ? (
                      <Button size="sm" variant="secondary" onClick={handleShowDemo}>
                        <RotateCcw className="size-4" aria-hidden="true" />
                        <span className="fit-label">{t("button.demo")}</span>
                      </Button>
                    ) : null}
                    <div className="grid size-10 place-items-center rounded-md bg-navy-950 text-white">
                      <ImageIcon className="size-5" aria-hidden="true" />
                    </div>
                  </div>
                </div>
                {previewAfter ? (
                  <BeforeAfterSlider
                    beforeSrc={previewBefore}
                    afterSrc={previewAfter}
                    beforeAlt={t("preview.beforeAlt")}
                    afterAlt={t("preview.afterAlt")}
                  />
                ) : (
                  <AwaitingAfterPreview
                    beforeSrc={previewBefore}
                    canGenerate={canGenerate}
                    configurationDirty={configurationDirty}
                    hasRoomImage={hasRoomImage}
                    isGenerating={isGenerating}
                    projectStatus={activeProject?.status}
                    onGenerate={handleGenerate}
                  />
                )}
              </div>
              <div id="downloads" className="scroll-mt-24">
                <DownloadsPanel project={activeProject} onSaveToMedia={handleSaveToMedia} />
              </div>
            </section>
          </div>

          <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]">
            <section id="recent-projects" className="min-w-0 scroll-mt-20 rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:scroll-mt-24 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-champagne-500 sm:text-xs sm:tracking-[0.2em]">{t("recent.kicker")}</p>
                  <h2 className="mt-2 text-xl font-semibold text-navy-950 sm:text-2xl">{t("recent.title")}</h2>
                </div>
                <LayoutDashboard className="size-5 text-navy-950" aria-hidden="true" />
              </div>
              <RecentProjects
                projects={projects}
                activeProjectId={activeProject?.id}
                onSelect={handleProjectSelect}
              />
            </section>

            <div className="min-w-0 space-y-6">
              <MediaLibraryPanel assets={mediaAssets} onRemove={handleRemoveMedia} onUseAsInput={handleUseMediaAsInput} />

              <section id="property-library" className="scroll-mt-20 rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:scroll-mt-24 sm:p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-champagne-500 sm:text-xs sm:tracking-[0.2em]">{t("property.kicker")}</p>
                    <h2 className="mt-2 text-xl font-semibold text-navy-950 sm:text-2xl">{t("property.title")}</h2>
                  </div>
                  <Button variant="ghost" size="sm">
                    <span className="fit-label">{t("button.open")}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {libraryItems.map((item) => (
                    <article key={item.name} className="overflow-hidden rounded-md border border-silver-200 bg-white">
                      <div className="aspect-[4/3] overflow-hidden bg-silver-100">
                        <img src={item.image} alt={item.name} className="size-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-3">
                        <p className="fit-label line-clamp-2 text-sm font-semibold text-navy-950">{item.name}</p>
                        <p className="mt-1 text-xs text-charcoal-800">{t(item.locationKey)}</p>
                        <p className="fit-label mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-champagne-500 sm:tracking-[0.16em]">
                          {t(item.roomsKey)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

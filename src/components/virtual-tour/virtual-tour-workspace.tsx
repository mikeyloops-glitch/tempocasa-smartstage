/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Box,
  Camera,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileVideo,
  Home,
  ImagePlus,
  Link2,
  Loader2,
  Map,
  Maximize2,
  Plus,
  RotateCcw,
  RotateCw,
  Route,
  Save,
  ScanLine,
  Sparkles,
  UploadCloud,
  Video,
  VideoOff
} from "lucide-react";
import { TempoCasaLogo } from "@/components/brand/tempocasa-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { Button } from "@/components/ui/button";
import { TourModelPreview } from "@/components/virtual-tour/tour-model-preview";
import { useLanguage } from "@/lib/i18n";

const captureDirections = [
  { id: "front", labelKey: "tour.direction.front", angle: 0 },
  { id: "front-right", labelKey: "tour.direction.frontRight", angle: 45 },
  { id: "right", labelKey: "tour.direction.right", angle: 90 },
  { id: "back-right", labelKey: "tour.direction.backRight", angle: 135 },
  { id: "back", labelKey: "tour.direction.back", angle: 180 },
  { id: "back-left", labelKey: "tour.direction.backLeft", angle: 225 },
  { id: "left", labelKey: "tour.direction.left", angle: 270 },
  { id: "front-left", labelKey: "tour.direction.frontLeft", angle: 315 }
] as const;

const roomTypes = [
  { labelKey: "tour.room.living", value: "Soggiorno" },
  { labelKey: "tour.room.livingKitchen", value: "Soggiorno e cucina" },
  { labelKey: "tour.room.bedroom", value: "Camera da letto" },
  { labelKey: "tour.room.kitchen", value: "Cucina" },
  { labelKey: "tour.room.bathroom", value: "Bagno" },
  { labelKey: "tour.room.corridor", value: "Corridoio" },
  { labelKey: "tour.room.office", value: "Studio" },
  { labelKey: "tour.room.garden", value: "Giardino" }
] as const;

const backendMilestones = [
  { labelKey: "tour.milestone.phone", statusKey: "tour.status.active" },
  { labelKey: "tour.milestone.video", statusKey: "tour.status.active" },
  { labelKey: "tour.milestone.qa", statusKey: "tour.status.active" },
  { labelKey: "tour.milestone.webgl", statusKey: "tour.status.active" },
  { labelKey: "tour.milestone.supersplat", statusKey: "tour.status.active" },
  { labelKey: "tour.milestone.reconstruction", statusKey: "tour.status.next" }
];

type CaptureDirection = (typeof captureDirections)[number];
type DirectionId = (typeof captureDirections)[number]["id"];
type DirectionMode = "clockwise" | "counterclockwise";
type CaptureSourceMode = "guided-photos" | "walkthrough-video";
type CameraStatus = "idle" | "starting" | "active" | "blocked";

type AiTourReport = {
  checks?: string[];
  nextAction?: string;
  status?: string;
  summary: string;
};

type CapturedShot = {
  capturedAt: string;
  fileName: string;
  size: number;
  url: string;
};

type WalkthroughVideo = {
  capturedAt: string;
  fileName: string;
  size: number;
  url: string;
};

type SavedRoomSet = {
  capturedAt: string;
  coverUrl?: string;
  credits: number;
  id: string;
  name: string;
  type: string;
};

const houseDemoSceneUrl = "https://superspl.at/scene/e721ea7c";
const sampleSplatUrl = "https://developer.playcanvas.com/assets/toy-cat.sog";

function buildSuperSplatViewerUrl(contentUrl: string) {
  const trimmed = contentUrl.trim() || houseDemoSceneUrl;

  if (trimmed.startsWith("https://superspl.at/scene/")) {
    return trimmed;
  }

  return `/supersplat-viewer?content=${encodeURIComponent(trimmed)}&aa&nofx`;
}

function getShotPosition(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const radius = 42;

  return {
    left: `${50 + Math.sin(radians) * radius}%`,
    top: `${50 - Math.cos(radians) * radius}%`
  };
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function createShot(file: File, url: string): CapturedShot {
  return {
    capturedAt: new Date().toLocaleString("it-IT", {
      dateStyle: "short",
      timeStyle: "short"
    }),
    fileName: file.name || "camera-shot.jpg",
    size: file.size,
    url
  };
}

export function VirtualTourWorkspace() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [directionMode, setDirectionMode] = useState<DirectionMode>("clockwise");
  const [captureSourceMode, setCaptureSourceMode] = useState<CaptureSourceMode>("guided-photos");
  const [roomName, setRoomName] = useState("Ingresso principale");
  const [roomType, setRoomType] = useState<string>(roomTypes[0].value);
  const [shots, setShots] = useState<Partial<Record<DirectionId, CapturedShot>>>({});
  const [walkthroughVideo, setWalkthroughVideo] = useState<WalkthroughVideo | null>(null);
  const [savedRooms, setSavedRooms] = useState<SavedRoomSet[]>([]);
  const [draftStatus, setDraftStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [aiReport, setAiReport] = useState<AiTourReport | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraError, setCameraError] = useState("");
  const [splatUrl, setSplatUrl] = useState(houseDemoSceneUrl);
  const [superSplatViewerUrl, setSuperSplatViewerUrl] = useState(buildSuperSplatViewerUrl(houseDemoSceneUrl));
  const captureInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const orderedDirections = useMemo<CaptureDirection[]>(
    () => (directionMode === "clockwise" ? Array.from(captureDirections) : [captureDirections[0], ...Array.from(captureDirections).slice(1).reverse()]),
    [directionMode]
  );
  const activeDirection = orderedDirections[activeIndex] ?? orderedDirections[0];
  const activeShot = shots[activeDirection.id];
  const activeStep = activeIndex + 1;
  const completeCount = captureDirections.filter((direction) => shots[direction.id]).length;
  const missingCount = captureDirections.length - completeCount;
  const totalSteps = captureDirections.length;
  const capturedCredits = completeCount;
  const savedCredits = savedRooms.reduce((total, room) => total + room.credits, 0);
  const videoCredits = walkthroughVideo ? 1 : 0;
  const totalCredits = savedCredits + capturedCredits + videoCredits;
  const hasCompleteGuidedSet = completeCount === captureDirections.length;
  const hasWalkthroughSource = Boolean(walkthroughVideo);
  const canCreateDraft = hasCompleteGuidedSet || hasWalkthroughSource;
  const coverageStatus = hasCompleteGuidedSet
    ? t("tour.coverage.readyDraft")
    : hasWalkthroughSource
      ? t("tour.coverage.videoReady")
      : missingCount <= 2
        ? t("tour.coverage.almost")
        : t("tour.coverage.inProgress");
  const activeDirectionLabel = t(activeDirection.labelKey);
  const guideText = t(directionMode === "clockwise" ? "tour.guide.clockwise" : "tour.guide.counterclockwise", {
    label: activeDirectionLabel
  });
  const tourPanels = useMemo(
    () =>
      orderedDirections.map((direction) => ({
        angle: direction.angle,
        captured: Boolean(shots[direction.id]),
        id: direction.id,
        label: t(direction.labelKey),
        url: shots[direction.id]?.url
      })),
    [orderedDirections, shots, t]
  );

  const manifest = useMemo(
    () => ({
      app: "Tempo Casa SmartStage",
      workflow: "AI Virtual Tour",
      room: {
        name: roomName,
        type: roomType,
        requiredCredits: captureDirections.length,
        capturedCredits,
        status: coverageStatus
      },
      sourceMode: captureSourceMode,
      captureDirection: directionMode,
      walkthroughVideo: walkthroughVideo
        ? {
            capturedAt: walkthroughVideo.capturedAt,
            fileName: walkthroughVideo.fileName,
            size: walkthroughVideo.size
          }
        : null,
      superSplat: {
        contentUrl: splatUrl.trim() || houseDemoSceneUrl,
        viewerUrl: superSplatViewerUrl
      },
      shots: orderedDirections.map((direction) => ({
        angle: direction.angle,
        label: t(direction.labelKey),
        captured: Boolean(shots[direction.id]),
        fileName: shots[direction.id]?.fileName ?? null,
        size: shots[direction.id]?.size ?? null
      })),
      savedRooms: savedRooms.map((room) => ({
        capturedAt: room.capturedAt,
        credits: room.credits,
        id: room.id,
        name: room.name,
        type: room.type
      }))
    }),
    [capturedCredits, captureSourceMode, coverageStatus, directionMode, orderedDirections, roomName, roomType, savedRooms, shots, splatUrl, superSplatViewerUrl, t, walkthroughVideo]
  );

  function addShotFromFile(file: File) {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    const nextShots = {
      ...shots,
      [activeDirection.id]: createShot(file, url)
    };

    setShots(nextShots);
    setDraftStatus("idle");
    setAiReport(null);

    const nextMissingAfterActive = orderedDirections.findIndex((direction, index) => index > activeIndex && !nextShots[direction.id]);
    const firstMissing = orderedDirections.findIndex((direction) => !nextShots[direction.id]);

    if (nextMissingAfterActive >= 0) {
      setActiveIndex(nextMissingAfterActive);
    } else if (firstMissing >= 0) {
      setActiveIndex(firstMissing);
    }
  }

  function handleShotFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    addShotFromFile(file);

    event.target.value = "";
  }

  function handleWalkthroughVideoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);

    setWalkthroughVideo({
      capturedAt: new Date().toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "short"
      }),
      fileName: file.name || "walkthrough-video.mp4",
      size: file.size,
      url
    });
    setCaptureSourceMode("walkthrough-video");
    setDraftStatus("idle");
    setAiReport(null);

    event.target.value = "";
  }

  function clearWalkthroughVideo() {
    setWalkthroughVideo(null);
    setDraftStatus("idle");
    setAiReport(null);
  }

  function loadSuperSplatViewer() {
    setSuperSplatViewerUrl(buildSuperSplatViewerUrl(splatUrl));
  }

  function loadSampleSuperSplat() {
    setSplatUrl(sampleSplatUrl);
    setSuperSplatViewerUrl(buildSuperSplatViewerUrl(sampleSplatUrl));
  }

  function loadHouseSuperSplat() {
    setSplatUrl(houseDemoSceneUrl);
    setSuperSplatViewerUrl(buildSuperSplatViewerUrl(houseDemoSceneUrl));
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("blocked");
      setCameraError(t("upload.errorCameraCapture"));
      return;
    }

    setCameraStatus("starting");
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          height: { ideal: 1080 },
          width: { ideal: 1920 }
        }
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus("active");
    } catch (error) {
      console.error("Virtual tour camera could not start", error);
      setCameraStatus("blocked");
      setCameraError(t("upload.errorCameraBlocked"));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("idle");
  }

  async function captureLiveShot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || cameraStatus !== "active") {
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));

    if (!blob) {
      setCameraError(t("upload.errorCameraCapture"));
      return;
    }

    const file = new File([blob], `${activeDirection.id}-${Date.now()}.jpg`, { type: "image/jpeg" });
    addShotFromFile(file);
  }

  function removeActiveShot() {
    const nextShots = { ...shots };
    delete nextShots[activeDirection.id];
    setShots(nextShots);
    setDraftStatus("idle");
    setAiReport(null);
  }

  function resetCurrentRoom() {
    setShots({});
    setWalkthroughVideo(null);
    setActiveIndex(0);
    setDraftStatus("idle");
    setAiReport(null);
  }

  function saveRoomSet() {
    if (!canCreateDraft) {
      return;
    }

    const firstShot = captureDirections.map((direction) => shots[direction.id]).find(Boolean);

    setSavedRooms((current) => [
      {
        capturedAt: new Date().toLocaleString("it-IT", {
          dateStyle: "short",
          timeStyle: "short"
        }),
        coverUrl: firstShot?.url,
        credits: hasCompleteGuidedSet ? captureDirections.length : 1,
        id: crypto.randomUUID(),
        name: roomName.trim() || `${roomType} ${current.length + 1}`,
        type: hasCompleteGuidedSet ? roomType : `${roomType} video source`
      },
      ...current
    ]);
    resetCurrentRoom();
    setRoomName("");
  }

  async function createTourDraft() {
    if (!canCreateDraft) {
      return;
    }

    setDraftStatus("processing");
    setAiReport(null);

    try {
      const response = await fetch("/api/tour/analyze", {
        body: JSON.stringify({ manifest }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const data = (await response.json()) as { report?: AiTourReport; message?: string };

      setAiReport(
        data.report ?? {
          summary: data.message ?? t("tour.draft.fallback"),
          checks: [t("tour.draft.sourceReady"), t("tour.draft.previewActive")],
          nextAction: t("tour.button.saveRoom")
        }
      );
      setDraftStatus("ready");
    } catch {
      setAiReport({
        status: "local_preview_ready",
        summary: t("tour.draft.fallback"),
        checks: [t("tour.draft.sourceReady"), t("tour.draft.previewActive")],
        nextAction: t("tour.button.saveRoom")
      });
      setDraftStatus("ready");
    }
  }

  function downloadManifest() {
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tempocasa-virtual-tour-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-silver-50 text-charcoal-950">
      <header className="sticky top-0 z-40 border-b border-silver-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1480px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="TEMPOCASA SMARTSTAGE home" className="min-w-0 text-navy-950">
            <TempoCasaLogo className="hidden sm:flex" />
            <TempoCasaLogo className="sm:hidden" markOnly />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/dashboard#ai-generate">
                <Sparkles className="size-4" aria-hidden="true" />
                {t("tour.nav.smartstage")}
              </Link>
            </Button>
            <Button asChild className="bg-navy-950 text-white hover:bg-navy-900">
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t("tour.nav.home")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-navy-950 text-white">
        <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-champagne-300">{t("tour.hero.kicker")}</p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              {t("tour.hero.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-silver-100 sm:text-lg sm:leading-7">
              {t("tour.hero.subtitle")}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
              <div className="rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                <p className="text-xl font-semibold sm:text-2xl">{capturedCredits}/8</p>
                <p className="mt-1 text-sm text-silver-100">{t("tour.hero.currentCredits")}</p>
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                <p className="text-xl font-semibold sm:text-2xl">{savedRooms.length}</p>
                <p className="mt-1 text-sm text-silver-100">{t("tour.hero.savedRooms")}</p>
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                <p className="text-xl font-semibold sm:text-2xl">{totalCredits}</p>
                <p className="mt-1 text-sm text-silver-100">{t("tour.hero.totalCredits")}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            className="hidden rounded-md border border-white/15 bg-white/10 p-4 shadow-soft backdrop-blur sm:p-5 lg:block"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {backendMilestones.map((item) => (
                <div key={item.labelKey} className="rounded-md border border-white/15 bg-white/10 p-4">
                  <p className="text-sm font-semibold text-white">{t(item.labelKey)}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-champagne-300">{t(item.statusKey)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)_360px] lg:px-8 lg:py-8">
        <aside className="order-2 space-y-5 lg:order-1">
          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-navy-950 text-white">
                <Home className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-950">{t("tour.setup.title")}</p>
                <p className="text-xs text-charcoal-800">{coverageStatus}</p>
              </div>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800">{t("tour.setup.captureOption")}</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {[
                { id: "guided-photos" as const, detailKey: "tour.setup.guidedPhotosDetail", labelKey: "tour.setup.guidedPhotos" },
                { id: "walkthrough-video" as const, detailKey: "tour.setup.walkthroughVideoDetail", labelKey: "tour.setup.walkthroughVideo" }
              ].map((option) => {
                const selected = captureSourceMode === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    data-active={selected ? "true" : undefined}
                    onClick={() => setCaptureSourceMode(option.id)}
                    className={[
                      "interactive-surface min-h-16 rounded-md border px-3 py-3 text-left",
                      selected
                        ? "control-selected border-navy-950 bg-navy-950 text-white"
                        : "border-silver-200 bg-white text-charcoal-800 hover:border-silver-300 hover:bg-silver-50 hover:text-navy-950"
                      ].join(" ")}
                  >
                    <span className="block text-sm font-semibold">{t(option.labelKey)}</span>
                    <span className={["mt-1 block text-xs leading-5", selected ? "text-silver-100" : "text-charcoal-800"].join(" ")}>{t(option.detailKey)}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800" htmlFor="room-name">
              {t("tour.setup.roomName")}
            </label>
            <input
              id="room-name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder={t("tour.setup.roomNamePlaceholder")}
              className="mt-2 min-h-12 w-full rounded-md border border-silver-200 bg-white px-3 text-base text-charcoal-950 outline-none transition focus:border-navy-950 focus:ring-4 focus:ring-champagne-300/30"
            />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800">{t("tour.setup.roomType")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {roomTypes.map((type) => {
                const selected = type.value === roomType;

                return (
                  <button
                    key={type.value}
                    type="button"
                    data-active={selected ? "true" : undefined}
                    onClick={() => setRoomType(type.value)}
                    className={[
                      "interactive-surface min-h-12 rounded-md border px-3 py-2 text-left text-sm font-semibold leading-tight",
                      selected
                        ? "control-selected border-navy-950 bg-navy-950 text-white"
                      : "border-silver-200 bg-white text-charcoal-800 hover:border-silver-300 hover:bg-silver-50 hover:text-navy-950"
                    ].join(" ")}
                  >
                    <span className="fit-label block">{t(type.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">{t("tour.credits.title")}</p>
                <p className="mt-1 text-xs leading-5 text-charcoal-800">{t("tour.credits.help")}</p>
              </div>
              <div className="rounded-md bg-champagne-100 px-3 py-2 text-right text-navy-950">
                <p className="text-xl font-semibold">{capturedCredits}</p>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]">{t("tour.credits.of")}</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-silver-100">
              <div className="h-full rounded-full bg-navy-950 transition-all" style={{ width: `${(capturedCredits / 8) * 100}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={resetCurrentRoom} disabled={completeCount === 0 && !walkthroughVideo}>
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("tour.button.reset")}
              </Button>
              <Button onClick={saveRoomSet} disabled={!canCreateDraft}>
                <Save className="size-4" aria-hidden="true" />
                {t("tour.button.saveRoom")}
              </Button>
            </div>
          </div>
        </aside>

        <section className="order-1 min-w-0 space-y-5 lg:order-2">
          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-500">{t("tour.guided.kicker")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-navy-950 sm:text-3xl">{activeDirectionLabel}</h2>
                <p className="mt-1 text-sm text-charcoal-800">{t("tour.guided.position", { angle: activeDirection.angle })}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={captureInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleShotFile}
                />
                <input
                  ref={uploadInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleShotFile}
                />
                {cameraStatus === "active" ? (
                  <Button onClick={captureLiveShot}>
                    <ScanLine className="size-4" aria-hidden="true" />
                    {t("tour.button.captureAngle")}
                  </Button>
                ) : (
                  <Button onClick={startCamera} disabled={cameraStatus === "starting"}>
                    {cameraStatus === "starting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Video className="size-4" aria-hidden="true" />}
                    {t("tour.button.liveCamera")}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => captureInputRef.current?.click()}>
                  <Camera className="size-4" aria-hidden="true" />
                  {t("tour.button.devicePicker")}
                </Button>
                <Button variant="secondary" onClick={() => uploadInputRef.current?.click()}>
                  <UploadCloud className="size-4" aria-hidden="true" />
                  {t("tour.button.upload")}
                </Button>
                {cameraStatus === "active" ? (
                  <Button variant="secondary" onClick={stopCamera}>
                    <VideoOff className="size-4" aria-hidden="true" />
                    {t("tour.button.stop")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="grid gap-3 rounded-md border border-champagne-300 bg-champagne-100 p-3 text-sm leading-6 text-navy-950 md:grid-cols-[minmax(0,1fr)_15rem]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne-600">{t("tour.guided.currentTarget")}</p>
                  <p className="mt-1 font-semibold text-navy-950">{activeDirectionLabel}</p>
                  <p className="mt-1">{guideText}</p>
                  <p className="mt-2 text-xs font-medium leading-5 text-charcoal-800">{t("tour.guided.liveOverlayNote")}</p>
                </div>
                <div className="rounded-md border border-white/70 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-800">
                    {t("tour.guide.stepStatus", { step: activeStep, total: totalSteps })}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative size-14 shrink-0 rounded-full border border-silver-200 bg-white">
                      <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-950" />
                      <div
                        className="absolute left-1/2 top-1/2 h-[42%] w-0.5 origin-bottom rounded-full bg-champagne-500"
                        style={{ transform: `translate(-50%, -100%) rotate(${activeDirection.angle}deg)` }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="fit-label text-sm font-semibold leading-tight text-navy-950">{activeDirectionLabel}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-800">
                        {t("tour.guide.target")} {activeDirection.angle} deg
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-active={directionMode === "clockwise" ? "true" : undefined}
                  onClick={() => {
                    setDirectionMode("clockwise");
                    setActiveIndex(0);
                  }}
                  className={[
                    "interactive-surface inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold",
                    directionMode === "clockwise"
                      ? "control-selected border-navy-950 bg-navy-950 text-white"
                      : "border-silver-200 bg-white text-charcoal-800 hover:bg-silver-50"
                  ].join(" ")}
                >
                  <RotateCw className="size-4" aria-hidden="true" />
                  {t("tour.button.right")}
                </button>
                <button
                  type="button"
                  data-active={directionMode === "counterclockwise" ? "true" : undefined}
                  onClick={() => {
                    setDirectionMode("counterclockwise");
                    setActiveIndex(0);
                  }}
                  className={[
                    "interactive-surface inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold",
                    directionMode === "counterclockwise"
                      ? "control-selected border-navy-950 bg-navy-950 text-white"
                      : "border-silver-200 bg-white text-charcoal-800 hover:bg-silver-50"
                  ].join(" ")}
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {t("tour.button.left")}
                </button>
              </div>
            </div>
            {cameraError ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900">
                {cameraError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative overflow-hidden rounded-md border border-silver-200 bg-charcoal-950">
                <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={[
                      "absolute inset-0 size-full object-cover",
                      cameraStatus === "active" || cameraStatus === "starting" ? "block" : "hidden"
                    ].join(" ")}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {cameraStatus === "active" || cameraStatus === "starting" ? (
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute inset-x-8 bottom-20 top-12 rounded-md border-2 border-white/80 shadow-[0_0_0_999px_rgba(17,20,24,0.18),0_0_32px_rgba(255,255,255,0.35)]" />
                      <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-navy-950">
                        {t("tour.guide.start")}
                      </div>
                      <div className="absolute right-3 top-3 w-[8.75rem] rounded-md border border-white/15 bg-charcoal-950/78 p-3 text-white shadow-soft backdrop-blur sm:w-40">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-champagne-300">
                          {t("tour.guide.stepStatus", { step: activeStep, total: totalSteps })}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{activeDirectionLabel}</p>
                        <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-silver-100">
                          {t("tour.guide.target")} {activeDirection.angle} deg
                        </p>
                        <div className="relative mt-3 aspect-square rounded-full border border-white/20 bg-white/10">
                          <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                          <div
                            className="absolute left-1/2 top-1/2 h-[42%] w-0.5 origin-bottom rounded-full bg-champagne-300"
                            style={{ transform: `translate(-50%, -100%) rotate(${activeDirection.angle}deg)` }}
                          />
                        </div>
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35 bg-charcoal-950/62 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                        {t("tour.guide.alignWall")}
                      </div>
                      <div
                        className="absolute left-1/2 top-1/2 h-[72%] w-px origin-bottom bg-champagne-300/80"
                        style={{ transform: `translate(-50%, -100%) rotate(${activeDirection.angle}deg)` }}
                      >
                        <div className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-champagne-300 shadow-soft" />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 rounded-md border border-white/15 bg-charcoal-950/78 p-3 text-white backdrop-blur">
                        <p className="text-sm font-semibold">{activeDirectionLabel}</p>
                        <p className="mt-1 text-xs leading-5 text-silver-100">{guideText}</p>
                      </div>
                    </div>
                  ) : activeShot ? (
                    <img
                      src={activeShot.url}
                      alt={`${activeDirectionLabel} capture`}
                      className="absolute inset-0 size-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                      <div>
                        <div className="mx-auto grid size-16 place-items-center rounded-md bg-white/10">
                          <ImagePlus className="size-8" aria-hidden="true" />
                        </div>
                        <p className="mt-4 text-lg font-semibold">{t("tour.capture.noShot")}</p>
                        <p className="mt-2 text-sm leading-6 text-silver-100">{t("tour.capture.noShotHelp")}</p>
                      </div>
                    </div>
                  )}
                  {cameraStatus !== "active" && cameraStatus !== "starting" ? (
                    <div className="absolute left-3 top-3 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy-950">
                      {activeDirection.angle} deg
                    </div>
                  ) : null}
                  {activeShot && cameraStatus !== "active" && cameraStatus !== "starting" ? (
                    <button
                      type="button"
                      onClick={removeActiveShot}
                      className="interactive-surface absolute bottom-3 right-3 rounded-md border border-white/20 bg-white/90 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-white"
                    >
                      {t("tour.capture.replace")}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-md border border-silver-200 bg-silver-50 p-4">
                <div className="relative mx-auto aspect-square max-w-[320px] rounded-full border border-silver-200 bg-white shadow-panel">
                  <div className="absolute inset-[21%] rounded-full border border-dashed border-silver-300" />
                  <div className="absolute inset-[34%] grid place-items-center rounded-full bg-navy-950 text-center text-white">
                    <Compass className="size-6" aria-hidden="true" />
                    <span className="mt-1 text-xs font-semibold">{capturedCredits}/8</span>
                  </div>
                  {orderedDirections.map((direction, index) => {
                    const captured = Boolean(shots[direction.id]);
                    const selected = index === activeIndex;
                    const position = getShotPosition(direction.angle);

                    return (
                      <button
                        key={direction.id}
                        type="button"
                        aria-label={`Select ${t(direction.labelKey)}`}
                        data-active={selected ? "true" : undefined}
                        onClick={() => setActiveIndex(index)}
                        className={[
                          "interactive-surface absolute grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-md border text-xs font-semibold",
                          selected
                            ? "control-selected border-navy-950 bg-navy-950 text-white"
                            : captured
                              ? "border-navy-900 bg-champagne-100 text-navy-950"
                              : "border-silver-200 bg-white text-charcoal-800 hover:border-silver-300"
                        ].join(" ")}
                        style={position}
                      >
                        {captured ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <span>{direction.angle}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-md border border-silver-200 bg-white p-3">
                  <p className="text-sm font-semibold text-navy-950">{coverageStatus}</p>
                  <p className="mt-1 text-xs leading-5 text-charcoal-800">
                    {hasCompleteGuidedSet
                      ? t("tour.coverage.roomComplete")
                      : hasWalkthroughSource
                        ? t("tour.coverage.videoReadyDetail")
                        : t("tour.coverage.creditsOpen", { count: missingCount })}
                  </p>
                  {activeShot ? (
                    <p className="mt-3 text-xs text-charcoal-800">
                      {activeShot.fileName} / {formatBytes(activeShot.size)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-500">{t("tour.video.kicker")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-navy-950">{t("tour.video.title")}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-charcoal-800">
                  {t("tour.video.body")}
                </p>
              </div>
              <Button onClick={() => videoInputRef.current?.click()}>
                <FileVideo className="size-4" aria-hidden="true" />
                {t("tour.video.record")}
              </Button>
              <input
                ref={videoInputRef}
                className="sr-only"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/*"
                capture="environment"
                onChange={handleWalkthroughVideoFile}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="overflow-hidden rounded-md border border-silver-200 bg-charcoal-950">
                <div className="relative aspect-video">
                  {walkthroughVideo ? (
                    <video src={walkthroughVideo.url} controls playsInline className="absolute inset-0 size-full bg-black object-contain" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                      <div>
                        <div className="mx-auto grid size-14 place-items-center rounded-md bg-white/10">
                          <Video className="size-7" aria-hidden="true" />
                        </div>
                        <p className="mt-4 text-base font-semibold">{t("tour.video.noVideo")}</p>
                        <p className="mt-2 text-sm leading-6 text-silver-100">{t("tour.video.noVideoHelp")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-silver-200 bg-silver-50 p-4">
                <p className="text-sm font-semibold text-navy-950">{t("tour.video.package")}</p>
                <p className="mt-2 text-sm leading-6 text-charcoal-800">
                  {t("tour.video.packageBody")}
                </p>
                {walkthroughVideo ? (
                  <div className="mt-4 rounded-md border border-silver-200 bg-white p-3 text-sm text-charcoal-800">
                    <p className="font-semibold text-navy-950">{walkthroughVideo.fileName}</p>
                    <p className="mt-1">{formatBytes(walkthroughVideo.size)}</p>
                    <p className="mt-1">{walkthroughVideo.capturedAt}</p>
                    <Button variant="secondary" className="mt-3 w-full" onClick={clearWalkthroughVideo}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      {t("tour.video.clear")}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-dashed border-silver-300 bg-white p-3 text-sm leading-6 text-charcoal-800">
                    {t("tour.video.bestPractice")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{t("tour.draft.title")}</p>
                  <p className="mt-1 text-sm leading-6 text-charcoal-800">{t("tour.draft.body")}</p>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" onClick={createTourDraft} disabled={!canCreateDraft || draftStatus === "processing"}>
                  {draftStatus === "processing" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                  {draftStatus === "processing" ? t("tour.draft.preparing") : t("tour.draft.create")}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["tour.draft.sourceReady", "tour.draft.qaConnected", "tour.draft.previewActive"].map((item, index) => {
                  const ready = (index === 0 && canCreateDraft) || (index === 1 && Boolean(aiReport)) || index === 2;

                  return (
                    <div key={item} className="rounded-md border border-silver-200 bg-silver-50 p-3">
                      <div className="flex items-center gap-2">
                        {ready ? <CheckCircle2 className="size-4 text-navy-950" aria-hidden="true" /> : <Eye className="size-4 text-charcoal-800" aria-hidden="true" />}
                        <p className="text-sm font-semibold text-charcoal-950">{t(item)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {draftStatus === "ready" ? (
                <div className="mt-4 rounded-md border border-champagne-300 bg-champagne-100 p-4 text-navy-950">
                  <p className="font-semibold">{t("tour.draft.ready")}</p>
                  <p className="mt-1 text-sm leading-6">{aiReport?.summary ?? t("tour.draft.fallback")}</p>
                  {aiReport?.checks?.length ? (
                    <ul className="mt-3 space-y-1 text-sm leading-6">
                      {aiReport.checks.slice(0, 4).map((check) => (
                        <li key={check} className="flex gap-2">
                          <CheckCircle2 className="mt-1 size-4 shrink-0" aria-hidden="true" />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-navy-950">{t("tour.manifest.title")}</p>
                  <p className="mt-1 text-sm leading-6 text-charcoal-800">{t("tour.manifest.body")}</p>
                </div>
                <Button variant="secondary" onClick={downloadManifest}>
                  <Download className="size-4" aria-hidden="true" />
                  JSON
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-500">{t("tour.webgl.kicker")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-navy-950">{t("tour.webgl.title")}</h2>
                <p className="mt-1 text-sm leading-6 text-charcoal-800">
                  {t("tour.webgl.body")}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-silver-200 bg-silver-50 px-3 py-2 text-sm font-semibold text-navy-950">
                <Box className="size-4" aria-hidden="true" />
                {t("tour.webgl.mapped", { count: completeCount })}
              </div>
            </div>
            <TourModelPreview panels={tourPanels} readyCount={completeCount} />
          </div>

          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-500">{t("tour.splat.kicker")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-navy-950">{t("tour.splat.title")}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-charcoal-800">
                  {t("tour.splat.body")}
                </p>
              </div>
              <Button asChild variant="secondary">
                <a href={superSplatViewerUrl} target="_blank" rel="noreferrer">
                  <Maximize2 className="size-4" aria-hidden="true" />
                  {t("tour.splat.fullscreen")}
                </a>
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800">{t("tour.splat.url")}</span>
                <span className="mt-2 flex min-h-12 items-center gap-2 rounded-md border border-silver-200 bg-white px-3 focus-within:border-navy-950 focus-within:ring-4 focus-within:ring-champagne-300/30">
                  <Link2 className="size-4 shrink-0 text-charcoal-800" aria-hidden="true" />
                  <input
                    value={splatUrl}
                    onChange={(event) => setSplatUrl(event.target.value)}
                    placeholder="https://.../room.sog or superspl.at/scene/..."
                    className="min-w-0 flex-1 bg-transparent text-base text-charcoal-950 outline-none"
                    type="text"
                  />
                </span>
              </label>
              <Button variant="secondary" onClick={loadHouseSuperSplat}>
                <Home className="size-4" aria-hidden="true" />
                {t("tour.splat.loadHouse")}
              </Button>
              <Button variant="secondary" onClick={loadSampleSuperSplat}>
                <Box className="size-4" aria-hidden="true" />
                {t("tour.splat.loadSample")}
              </Button>
              <Button onClick={loadSuperSplatViewer}>
                <ExternalLink className="size-4" aria-hidden="true" />
                {t("tour.splat.loadViewer")}
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-md border border-silver-200 bg-charcoal-950">
              <iframe
                title="Tempo Casa SuperSplat viewer"
                src={superSplatViewerUrl}
                className="h-[460px] w-full bg-black sm:h-[560px]"
                allow="fullscreen; xr-spatial-tracking"
              />
            </div>
          </div>
        </section>

        <aside className="order-3 space-y-5">
          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-navy-950 text-white">
                <Route className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-950">{t("tour.queue.title")}</p>
                <p className="text-xs text-charcoal-800">{t("tour.queue.nodesSaved", { count: savedRooms.length })}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {savedRooms.length > 0 ? (
                savedRooms.map((room) => (
                  <article key={room.id} className="overflow-hidden rounded-md border border-silver-200 bg-silver-50">
                    {room.coverUrl ? (
                      <img src={room.coverUrl} alt={`${room.name} cover`} className="h-28 w-full object-cover" loading="lazy" />
                    ) : null}
                    <div className="p-3">
                      <p className="font-semibold text-navy-950">{room.name}</p>
                      <p className="mt-1 text-sm text-charcoal-800">{room.type}</p>
                      <div className="mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-800">
                        <span>{room.credits} credits</span>
                        <span>{room.capturedAt}</span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-silver-300 bg-silver-50 p-5 text-center">
                  <Map className="mx-auto size-7 text-navy-950" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-navy-950">{t("tour.queue.noNodes")}</p>
                  <p className="mt-1 text-xs leading-5 text-charcoal-800">{t("tour.queue.noNodesBody")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-silver-200 bg-charcoal-950 p-4 text-white shadow-panel">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-white/10">
                <Plus className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("tour.backend.title")}</p>
                <p className="text-xs text-silver-100">{t("tour.backend.subtitle")}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-silver-100">
              {t("tour.backend.body")}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

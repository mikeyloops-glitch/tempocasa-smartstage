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
  Eye,
  Home,
  ImagePlus,
  Loader2,
  Map,
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
import { Button } from "@/components/ui/button";
import { TourModelPreview } from "@/components/virtual-tour/tour-model-preview";

const captureDirections = [
  { id: "front", label: "12 o'clock wall", angle: 0 },
  { id: "front-right", label: "1:30 angle", angle: 45 },
  { id: "right", label: "3 o'clock wall", angle: 90 },
  { id: "back-right", label: "4:30 angle", angle: 135 },
  { id: "back", label: "6 o'clock wall", angle: 180 },
  { id: "back-left", label: "7:30 angle", angle: 225 },
  { id: "left", label: "9 o'clock wall", angle: 270 },
  { id: "front-left", label: "10:30 angle", angle: 315 }
] as const;

const roomTypes = [
  "Soggiorno",
  "Soggiorno e cucina",
  "Camera da letto",
  "Cucina",
  "Bagno",
  "Corridoio",
  "Studio",
  "Giardino"
];

const backendMilestones = [
  { label: "Phone 360 capture", status: "Active" },
  { label: "OpenAI capture QA", status: "Active" },
  { label: "3D WebGL preview", status: "Active" },
  { label: "SuperSplat export", status: "Next" }
];

type CaptureDirection = (typeof captureDirections)[number];
type DirectionId = (typeof captureDirections)[number]["id"];
type DirectionMode = "clockwise" | "counterclockwise";
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

type SavedRoomSet = {
  capturedAt: string;
  coverUrl?: string;
  credits: number;
  id: string;
  name: string;
  type: string;
};

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [directionMode, setDirectionMode] = useState<DirectionMode>("clockwise");
  const [roomName, setRoomName] = useState("Ingresso principale");
  const [roomType, setRoomType] = useState(roomTypes[0]);
  const [shots, setShots] = useState<Partial<Record<DirectionId, CapturedShot>>>({});
  const [savedRooms, setSavedRooms] = useState<SavedRoomSet[]>([]);
  const [draftStatus, setDraftStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [aiReport, setAiReport] = useState<AiTourReport | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraError, setCameraError] = useState("");
  const captureInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
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
  const completeCount = captureDirections.filter((direction) => shots[direction.id]).length;
  const missingCount = captureDirections.length - completeCount;
  const capturedCredits = completeCount;
  const savedCredits = savedRooms.reduce((total, room) => total + room.credits, 0);
  const totalCredits = savedCredits + capturedCredits;
  const canCreateDraft = completeCount === captureDirections.length;
  const coverageStatus = canCreateDraft ? "Ready for AI tour draft" : missingCount <= 2 ? "Almost complete" : "Capture in progress";
  const guideDirectionText = directionMode === "clockwise" ? "move right / clockwise" : "move left / counter-clockwise";
  const guideText = `Start at 12 o'clock, keep the phone level, place the wall inside the ghost frame, then ${guideDirectionText} to ${activeDirection.label}.`;
  const tourPanels = useMemo(
    () =>
      orderedDirections.map((direction) => ({
        angle: direction.angle,
        captured: Boolean(shots[direction.id]),
        id: direction.id,
        label: direction.label,
        url: shots[direction.id]?.url
      })),
    [orderedDirections, shots]
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
      captureDirection: directionMode,
      shots: orderedDirections.map((direction) => ({
        angle: direction.angle,
        label: direction.label,
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
    [capturedCredits, coverageStatus, directionMode, orderedDirections, roomName, roomType, savedRooms, shots]
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

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("blocked");
      setCameraError("Camera preview is not available in this browser. Use Upload or the device picker.");
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
      setCameraError("Camera access was blocked or unavailable. Allow camera permission, then retry.");
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
      setCameraError("Camera frame could not be captured. Try again.");
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
        credits: captureDirections.length,
        id: crypto.randomUUID(),
        name: roomName.trim() || `${roomType} ${current.length + 1}`,
        type: roomType
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
          summary: data.message ?? "3D preview is ready. OpenAI QA returned no additional guidance.",
          checks: ["All eight angles were captured.", "Use the WebGL preview for this pilot room node."],
          nextAction: "Save the room node."
        }
      );
      setDraftStatus("ready");
    } catch {
      setAiReport({
        status: "local_preview_ready",
        summary: "3D preview is ready locally. OpenAI QA could not be reached from this browser session.",
        checks: ["All eight angles were captured.", "Use the WebGL preview and save the room node."],
        nextAction: "Save the room node."
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
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/dashboard#ai-generate">
                <Sparkles className="size-4" aria-hidden="true" />
                AI SmartStage
              </Link>
            </Button>
            <Button asChild className="bg-navy-950 text-white hover:bg-navy-900">
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Home
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-champagne-300">TEMPOCASA AI VIRTUAL TOUR</p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Guided 360 capture for property walkthroughs.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-silver-100 sm:text-lg sm:leading-7">
              Capture each room as an 8-shot set, save the room node, and prepare the media package for AI alignment and a future walkable tour viewer.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
              <div className="rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                <p className="text-xl font-semibold sm:text-2xl">{capturedCredits}/8</p>
                <p className="mt-1 text-sm text-silver-100">Current credits</p>
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                <p className="text-xl font-semibold sm:text-2xl">{savedRooms.length}</p>
                <p className="mt-1 text-sm text-silver-100">Saved rooms</p>
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-3 sm:p-4">
                <p className="text-xl font-semibold sm:text-2xl">{totalCredits}</p>
                <p className="mt-1 text-sm text-silver-100">Total credits</p>
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
                <div key={item.label} className="rounded-md border border-white/15 bg-white/10 p-4">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-champagne-300">{item.status}</p>
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
                <p className="text-sm font-semibold text-navy-950">Room setup</p>
                <p className="text-xs text-charcoal-800">{coverageStatus}</p>
              </div>
            </div>
            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800" htmlFor="room-name">
              Room name
            </label>
            <input
              id="room-name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Soggiorno principale"
              className="mt-2 min-h-12 w-full rounded-md border border-silver-200 bg-white px-3 text-base text-charcoal-950 outline-none transition focus:border-navy-950 focus:ring-4 focus:ring-champagne-300/30"
            />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal-800">Tipo di stanza</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {roomTypes.map((type) => {
                const selected = type === roomType;

                return (
                  <button
                    key={type}
                    type="button"
                    data-active={selected ? "true" : undefined}
                    onClick={() => setRoomType(type)}
                    className={[
                      "interactive-surface min-h-12 rounded-md border px-3 py-2 text-left text-sm font-semibold leading-tight",
                      selected
                        ? "control-selected border-navy-950 bg-navy-950 text-white"
                        : "border-silver-200 bg-white text-charcoal-800 hover:border-silver-300 hover:bg-silver-50 hover:text-navy-950"
                    ].join(" ")}
                  >
                    <span className="fit-label block">{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">Capture credits</p>
                <p className="mt-1 text-xs leading-5 text-charcoal-800">8 credits complete one room node.</p>
              </div>
              <div className="rounded-md bg-champagne-100 px-3 py-2 text-right text-navy-950">
                <p className="text-xl font-semibold">{capturedCredits}</p>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]">of 8</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-silver-100">
              <div className="h-full rounded-full bg-navy-950 transition-all" style={{ width: `${(capturedCredits / 8) * 100}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={resetCurrentRoom} disabled={completeCount === 0}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset
              </Button>
              <Button onClick={saveRoomSet} disabled={!canCreateDraft}>
                <Save className="size-4" aria-hidden="true" />
                Save room
              </Button>
            </div>
          </div>
        </aside>

        <section className="order-1 min-w-0 space-y-5 lg:order-2">
          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-500">Guided 360 Capture</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-navy-950 sm:text-3xl">{activeDirection.label}</h2>
                <p className="mt-1 text-sm text-charcoal-800">{activeDirection.angle} deg position</p>
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
                    Capture angle
                  </Button>
                ) : (
                  <Button onClick={startCamera} disabled={cameraStatus === "starting"}>
                    {cameraStatus === "starting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Video className="size-4" aria-hidden="true" />}
                    Live camera
                  </Button>
                )}
                <Button variant="secondary" onClick={() => captureInputRef.current?.click()}>
                  <Camera className="size-4" aria-hidden="true" />
                  Device picker
                </Button>
                <Button variant="secondary" onClick={() => uploadInputRef.current?.click()}>
                  <UploadCloud className="size-4" aria-hidden="true" />
                  Upload
                </Button>
                {cameraStatus === "active" ? (
                  <Button variant="secondary" onClick={stopCamera}>
                    <VideoOff className="size-4" aria-hidden="true" />
                    Stop
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="rounded-md border border-champagne-300 bg-champagne-100 p-3 text-sm leading-6 text-navy-950">
                {guideText}
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
                  Right
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
                  Left
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
                        12 o&apos;clock start
                      </div>
                      <div
                        className="absolute left-1/2 top-1/2 h-[72%] w-px origin-bottom bg-champagne-300/80"
                        style={{ transform: `translate(-50%, -100%) rotate(${directionMode === "clockwise" ? activeDirection.angle : -activeDirection.angle}deg)` }}
                      >
                        <div className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-champagne-300 shadow-soft" />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 rounded-md border border-white/15 bg-charcoal-950/78 p-3 text-white backdrop-blur">
                        <p className="text-sm font-semibold">{activeDirection.label}</p>
                        <p className="mt-1 text-xs leading-5 text-silver-100">{guideText}</p>
                      </div>
                    </div>
                  ) : activeShot ? (
                    <img
                      src={activeShot.url}
                      alt={`${activeDirection.label} capture`}
                      className="absolute inset-0 size-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                      <div>
                        <div className="mx-auto grid size-16 place-items-center rounded-md bg-white/10">
                          <ImagePlus className="size-8" aria-hidden="true" />
                        </div>
                        <p className="mt-4 text-lg font-semibold">No shot captured</p>
                        <p className="mt-2 text-sm leading-6 text-silver-100">Select camera or upload for this angle.</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy-950">
                    {activeDirection.angle} deg
                  </div>
                  {activeShot && cameraStatus !== "active" && cameraStatus !== "starting" ? (
                    <button
                      type="button"
                      onClick={removeActiveShot}
                      className="interactive-surface absolute bottom-3 right-3 rounded-md border border-white/20 bg-white/90 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-white"
                    >
                      Replace
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
                        aria-label={`Select ${direction.label}`}
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
                    {missingCount === 0 ? "Room set complete." : `${missingCount} credits still open.`}
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

          <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-950">AI tour draft</p>
                  <p className="mt-1 text-sm leading-6 text-charcoal-800">Create the first room package after all 8 credits are captured.</p>
                </div>
                <Button onClick={createTourDraft} disabled={!canCreateDraft || draftStatus === "processing"}>
                  {draftStatus === "processing" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                  {draftStatus === "processing" ? "Preparing" : "Create draft"}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["Camera angles locked", "OpenAI QA connected", "3D preview active"].map((item, index) => {
                  const ready = (index === 0 && canCreateDraft) || (index === 1 && Boolean(aiReport)) || index === 2;

                  return (
                    <div key={item} className="rounded-md border border-silver-200 bg-silver-50 p-3">
                      <div className="flex items-center gap-2">
                        {ready ? <CheckCircle2 className="size-4 text-navy-950" aria-hidden="true" /> : <Eye className="size-4 text-charcoal-800" aria-hidden="true" />}
                        <p className="text-sm font-semibold text-charcoal-950">{item}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {draftStatus === "ready" ? (
                <div className="mt-4 rounded-md border border-champagne-300 bg-champagne-100 p-4 text-navy-950">
                  <p className="font-semibold">Draft package ready</p>
                  <p className="mt-1 text-sm leading-6">{aiReport?.summary ?? "Save this room set, then continue with the next room, corridor, doorway, or exterior position."}</p>
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
                  <p className="text-sm font-semibold text-navy-950">Capture manifest</p>
                  <p className="mt-1 text-sm leading-6 text-charcoal-800">Export the room metadata for backend testing.</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-500">3D Room Node</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-navy-950">Live WebGL preview</h2>
                <p className="mt-1 text-sm leading-6 text-charcoal-800">
                  Captured angles are mapped into a navigable 3D room ring for the demo. SuperSplat can replace this renderer when the Gaussian-splat file is generated.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-silver-200 bg-silver-50 px-3 py-2 text-sm font-semibold text-navy-950">
                <Box className="size-4" aria-hidden="true" />
                {completeCount}/8 mapped
              </div>
            </div>
            <TourModelPreview panels={tourPanels} readyCount={completeCount} />
          </div>
        </section>

        <aside className="order-3 space-y-5">
          <div className="rounded-md border border-silver-200 bg-white p-4 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-navy-950 text-white">
                <Route className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-950">Room queue</p>
                <p className="text-xs text-charcoal-800">{savedRooms.length} nodes saved</p>
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
                  <p className="mt-3 text-sm font-semibold text-navy-950">No room nodes yet</p>
                  <p className="mt-1 text-xs leading-5 text-charcoal-800">Complete 8 credits and save the room set.</p>
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
                <p className="text-sm font-semibold">Next backend layer</p>
                <p className="text-xs text-silver-100">SuperSplat-ready 3D package</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-silver-100">
              The capture manifest is structured for later AI alignment, panorama stitching, and PlayCanvas/SuperSplat publishing.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

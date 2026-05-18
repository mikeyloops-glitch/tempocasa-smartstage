"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileImage, ImagePlus, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";

type ImageUploaderProps = {
  label: string;
  helper: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  compact?: boolean;
  enableCamera?: boolean;
  normalizeToJpeg?: boolean;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const portraitFrame = { width: 1024, height: 1536 };
const landscapeFrame = { width: 1536, height: 1024 };
const squareFrame = { width: 1024, height: 1024 };

function getAiFrame(width: number, height: number) {
  const ratio = width / height;

  if (ratio > 1.12) {
    return landscapeFrame;
  }

  if (ratio < 0.88) {
    return portraitFrame;
  }

  return squareFrame;
}

function safeFileStem(name: string, fallback = "room-photo") {
  return (
    name
      .replace(/\.[^/.]+$/, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 64) || fallback
  );
}

export function ImageUploader({
  label,
  helper,
  file,
  onChange,
  accept = "image/*",
  compact = false,
  enableCamera = false,
  normalizeToJpeg = false
}: ImageUploaderProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        setCameraError(t("upload.errorCameraPreview"));
      });
    }
  }, [isCameraOpen, t]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
  }

  async function normalizeImageFile(nextFile: File) {
    if (!normalizeToJpeg) {
      return nextFile;
    }

    if (!nextFile.type.startsWith("image/")) {
      return nextFile;
    }

    const objectUrl = URL.createObjectURL(nextFile);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Image could not be opened."));
        element.src = objectUrl;
      });

      const frame = getAiFrame(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = frame.width;
      canvas.height = frame.height;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error(t("upload.errorType"));
      }

      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = frame.width / frame.height;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;

      if (sourceRatio > targetRatio) {
        sourceWidth = Math.round(image.naturalHeight * targetRatio);
        sourceX = Math.round((image.naturalWidth - sourceWidth) / 2);
      } else if (sourceRatio < targetRatio) {
        sourceHeight = Math.round(image.naturalWidth / targetRatio);
        sourceY = Math.round((image.naturalHeight - sourceHeight) / 2);
      }

      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, frame.width, frame.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Image could not be converted."));
            }
          },
          "image/jpeg",
          0.92
        );
      });

      return new File([blob], `${safeFileStem(nextFile.name)}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now()
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleFile(nextFile?: File) {
    if (!nextFile) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const preparedFile = await normalizeImageFile(nextFile);

      if (!allowedTypes.includes(preparedFile.type)) {
        setError(t("upload.errorType"));
        return;
      }

      if (preparedFile.size > 20 * 1024 * 1024) {
        setError(t("upload.errorSize"));
        return;
      }

      onChange(preparedFile);
    } catch {
      setError(t("upload.errorType"));
    } finally {
      setIsProcessing(false);
    }
  }

  function openNativeCameraPicker() {
    cameraInputRef.current?.click();
  }

  async function openCamera() {
    setError(null);
    setCameraError(null);

    const canUseLiveCamera =
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      window.isSecureContext &&
      Boolean(navigator.mediaDevices?.getUserMedia);

    if (!canUseLiveCamera) {
      openNativeCameraPicker();
      return;
    }

    setIsStartingCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch {
      setCameraError(t("upload.errorCameraBlocked"));
      openNativeCameraPicker();
    } finally {
      setIsStartingCamera(false);
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(t("upload.errorCameraStarting"));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError(t("upload.errorCameraCapture"));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Photo could not be captured."));
          }
        },
        "image/jpeg",
        0.92
      );
    });

    const photo = new File([blob], `room-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now()
    });

    stopCamera();
    await handleFile(photo);
  }

  return (
    <div>
      <div
        className={[
          "relative rounded-md border border-dashed bg-white transition",
          isDragging ? "border-navy-900 bg-silver-50" : "border-silver-200",
          compact ? "p-3 sm:p-4" : "p-4 sm:p-6"
        ].join(" ")}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={accept}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        {enableCamera ? (
          <input
            ref={cameraInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const nextFile = event.target.files?.[0];

              if (nextFile) {
                stopCamera();
              }

              void handleFile(nextFile);
              event.currentTarget.value = "";
            }}
          />
        ) : null}

        {file ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-md bg-navy-950 text-white">
                <FileImage className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="fit-label line-clamp-2 text-base font-semibold text-navy-950 sm:text-sm">{file.name}</p>
                <p className="mt-1 text-xs text-charcoal-800">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button aria-label={t("upload.remove")} size="icon" variant="ghost" onClick={() => onChange(null)}>
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="grid size-12 place-items-center rounded-md bg-navy-950 text-white">
              {compact ? <ImagePlus className="size-5" aria-hidden="true" /> : <UploadCloud className="size-5" aria-hidden="true" />}
            </div>
            <p className="fit-label mt-4 text-base font-semibold text-navy-950 sm:text-sm">{label}</p>
            <p className="mt-2 max-w-sm text-base leading-7 text-charcoal-800 sm:text-sm sm:leading-6">{helper}</p>
            <div className="mt-5 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
              {enableCamera ? (
                <Button className="w-full sm:w-auto" disabled={isProcessing || isStartingCamera} onClick={openCamera}>
                  <Camera className="size-4" aria-hidden="true" />
                  <span className="fit-label">{isStartingCamera || isProcessing ? t("upload.preparing") : t("upload.takePhoto")}</span>
                </Button>
              ) : null}
              <Button className="w-full sm:w-auto" disabled={isProcessing} variant="secondary" onClick={() => inputRef.current?.click()}>
                <UploadCloud className="size-4" aria-hidden="true" />
                <span className="fit-label">{isProcessing ? t("upload.preparing") : t("upload.choose")}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
      {cameraError ? <p className="mt-2 text-sm font-medium text-red-700">{cameraError}</p> : null}
      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 bg-charcoal-950/95 p-3 backdrop-blur-sm sm:p-4 md:p-8">
          <Button
            aria-label="Close camera"
            className="absolute right-4 top-4 z-10 bg-white text-navy-950 hover:bg-silver-100"
            size="icon"
            variant="secondary"
            onClick={stopCamera}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
          <div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-3 sm:gap-4">
            <div className="overflow-hidden rounded-md border border-white/20 bg-black shadow-soft">
              <video
                ref={videoRef}
                aria-label="Live camera preview"
                autoPlay
                className="max-h-[72svh] w-full object-contain sm:aspect-[4/3] sm:object-cover"
                muted
                playsInline
              />
            </div>
            {cameraError ? <p className="text-sm font-medium text-red-200">{cameraError}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button className="bg-white text-navy-950 hover:bg-silver-100" onClick={capturePhoto}>
                <Camera className="size-4" aria-hidden="true" />
                <span className="fit-label">{t("upload.capturePhoto")}</span>
              </Button>
              <Button className="border-white/20 bg-white/10 text-white hover:bg-white/20" variant="secondary" onClick={openNativeCameraPicker}>
                <UploadCloud className="size-4" aria-hidden="true" />
                <span className="fit-label">{t("upload.devicePicker")}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

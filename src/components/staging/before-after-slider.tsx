/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
  priority?: boolean;
  tone?: "dark" | "light";
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  className,
  tone = "dark"
}: BeforeAfterSliderProps) {
  const { t } = useLanguage();
  const [position, setPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const activePointerId = useRef<number | null>(null);
  const afterClip = `inset(0 ${100 - position}% 0 0)`;
  const handlePosition = `clamp(20px, ${position}%, calc(100% - 20px))`;
  const imageClass = "absolute inset-0 h-full w-full object-contain object-center";
  const valueText = position === 0 ? t("preview.before") : position === 100 ? t("preview.after") : `${position}% ${t("preview.after").toLowerCase()}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  function setClampedPosition(value: number) {
    const rounded = Math.min(100, Math.max(0, Math.round(value)));

    if (rounded <= 2) {
      setPosition(0);
      return;
    }

    if (rounded >= 98) {
      setPosition(100);
      return;
    }

    setPosition(rounded);
  }

  function updateFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextPosition = ((event.clientX - rect.left) / rect.width) * 100;
    setClampedPosition(nextPosition);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateFromPointer(event);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keyActions: Record<string, number> = {
      ArrowLeft: position - 5,
      ArrowDown: position - 5,
      ArrowRight: position + 5,
      ArrowUp: position + 5,
      PageDown: position - 10,
      PageUp: position + 10,
      Home: 0,
      End: 100
    };

    if (!(event.key in keyActions)) {
      return;
    }

    event.preventDefault();
    setClampedPosition(keyActions[event.key]);
  }

  function renderSlider({ showFullscreenButton = true, fullscreen = false } = {}) {
    const isLight = tone === "light";

    return (
    <div
      className={cn(
        "relative min-w-0 max-w-full overflow-hidden rounded-md border shadow-soft",
        fullscreen ? "h-full w-full border-white/15 shadow-none" : null,
        isLight ? "border-silver-200 bg-white" : "border-white/20 bg-charcoal-950",
        className
      )}
    >
      <div className={cn("relative w-full select-none", fullscreen ? "h-full min-h-[360px]" : "aspect-[4/5] sm:aspect-[16/10]")}>
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className={cn(imageClass, "z-0")}
          draggable={false}
          loading={fullscreen ? "eager" : "lazy"}
        />
        <img
          src={afterSrc}
          alt={afterAlt}
          className={cn(imageClass, "z-[1]")}
          draggable={false}
          loading={fullscreen ? "eager" : "lazy"}
          style={{ clipPath: afterClip, WebkitClipPath: afterClip, willChange: "clip-path" }}
        />
        <div
          className="absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(17,20,24,0.18)]"
          style={{ left: handlePosition }}
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/75 bg-white/90 text-navy-950 shadow-panel sm:size-10">
            <span className="h-5 w-px bg-silver-300" />
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-2 bottom-2 z-20 flex items-center justify-between rounded-sm px-2 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] sm:inset-x-4 sm:bottom-4 sm:px-3 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.16em]",
            isLight
              ? "border border-silver-200 bg-white/92 text-charcoal-800 shadow-panel backdrop-blur"
              : "bg-charcoal-950/72 text-white"
          )}
        >
          <span className={position < 50 ? "text-navy-900" : isLight ? "text-charcoal-800/70" : "text-white/70"}>{t("preview.before")}</span>
          <span className={position >= 50 ? "text-navy-900" : isLight ? "text-charcoal-800/70" : "text-white/70"}>{t("preview.after")}</span>
        </div>
        <div
          aria-label={t("preview.title")}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={position}
          aria-valuetext={valueText}
          className={cn(
            "absolute inset-0 z-20 cursor-ew-resize touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne-300 focus-visible:ring-offset-2",
            isLight ? "focus-visible:ring-offset-white" : "focus-visible:ring-offset-charcoal-950"
          )}
          role="slider"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={handlePointerEnd}
        />
        {showFullscreenButton ? (
          <Button
            aria-label={t("fullscreen.open")}
            className="absolute right-2 top-2 z-30 bg-white/90 text-navy-950 hover:bg-white sm:right-3 sm:top-3"
            size="icon"
            variant="secondary"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
    );
  }

  return (
    <>
      {renderSlider()}
      {isFullscreen && isMounted ? createPortal(
        <div className="fixed inset-0 z-[100] bg-charcoal-950/96 text-white backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("preview.title")}>
          <div className="mx-auto flex h-[100svh] max-w-7xl flex-col gap-3 p-3 sm:gap-4 sm:p-5">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-champagne-300 sm:text-xs sm:tracking-[0.22em]">{t("preview.kicker")}</p>
                <h2 className="mt-1 text-lg font-semibold text-white sm:text-2xl">{t("preview.title")}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button className="hidden bg-white/10 text-white hover:bg-white/20 sm:inline-flex" size="sm" variant="ghost" onClick={() => setClampedPosition(0)}>
                  {t("preview.before")}
                </Button>
                <Button className="hidden bg-white/10 text-white hover:bg-white/20 sm:inline-flex" size="sm" variant="ghost" onClick={() => setClampedPosition(100)}>
                  {t("preview.after")}
                </Button>
                <Button
                  aria-label={t("fullscreen.close")}
                  className="bg-white text-navy-950 hover:bg-silver-100"
                  size="icon"
                  variant="secondary"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1">{renderSlider({ showFullscreenButton: false, fullscreen: true })}</div>

            <div className="shrink-0 rounded-md border border-white/15 bg-white/10 p-3 shadow-soft">
              <input
                aria-label={t("preview.title")}
                className="h-8 w-full accent-white"
                max={100}
                min={0}
                onChange={(event) => setClampedPosition(Number(event.currentTarget.value))}
                onInput={(event) => setClampedPosition(Number(event.currentTarget.value))}
                type="range"
                value={position}
              />
              <div className="mt-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-silver-100">
                <button className="rounded-sm px-2 py-1 text-left hover:bg-white/10" type="button" onClick={() => setClampedPosition(0)}>
                  {t("preview.before")}
                </button>
                <span>{position}%</span>
                <button className="rounded-sm px-2 py-1 text-right hover:bg-white/10" type="button" onClick={() => setClampedPosition(100)}>
                  {t("preview.after")}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
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
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  className
}: BeforeAfterSliderProps) {
  const { t } = useLanguage();
  const [position, setPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const afterClip = `inset(0 ${100 - position}% 0 0)`;
  const handlePosition = `clamp(20px, ${position}%, calc(100% - 20px))`;
  const imageClass = "absolute inset-0 h-full w-full object-contain object-center";
  const valueText = position === 0 ? t("preview.before") : position === 100 ? t("preview.after") : `${position}% ${t("preview.after").toLowerCase()}`;

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
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) {
      return;
    }

    updateFromPointer(event);
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

  function renderSlider(showFullscreenButton = true) {
    return (
    <div className={cn("relative w-full overflow-hidden rounded-md border border-white/20 bg-charcoal-950 shadow-soft", className)}>
      <div className="relative aspect-[4/5] w-full select-none sm:aspect-[16/10]">
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className={cn(imageClass, "z-0")}
          draggable={false}
          loading="lazy"
        />
        <img
          src={afterSrc}
          alt={afterAlt}
          className={cn(imageClass, "z-[1]")}
          draggable={false}
          loading="lazy"
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
        <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex items-center justify-between rounded-sm bg-charcoal-950/72 px-2 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-white sm:inset-x-4 sm:bottom-4 sm:px-3 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.16em]">
          <span className={position < 50 ? "text-champagne-300" : "text-white/70"}>{t("preview.before")}</span>
          <span className={position >= 50 ? "text-champagne-300" : "text-white/70"}>{t("preview.after")}</span>
        </div>
        <div
          aria-label={t("preview.title")}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={position}
          aria-valuetext={valueText}
          className="absolute inset-0 z-20 cursor-ew-resize touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne-300 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-950"
          role="slider"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
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
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 bg-charcoal-950/95 p-2 backdrop-blur-sm sm:p-4 md:p-8">
          <Button
            aria-label={t("fullscreen.close")}
            className="absolute right-4 top-4 z-[70] bg-white text-navy-950 hover:bg-silver-100"
            size="icon"
            variant="secondary"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
          <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center">{renderSlider(false)}</div>
        </div>
      ) : null}
    </>
  );
}

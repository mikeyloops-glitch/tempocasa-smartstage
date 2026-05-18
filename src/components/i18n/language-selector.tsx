"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { languages, useLanguage, type LanguageCode } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const cleanLabels: Record<LanguageCode, string> = {
    de: "Deutsch",
    en: "English",
    es: "Espanol",
    fr: "Francais",
    it: "Italiano"
  };

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t("app.language")}
        aria-expanded={open}
        data-active={open ? "true" : undefined}
        onClick={() => setOpen((current) => !current)}
        className="interactive-surface inline-flex min-h-10 items-center gap-1.5 rounded-md border border-white/20 bg-white/95 px-2.5 text-sm font-semibold text-navy-950 shadow-soft hover:bg-white sm:gap-2 sm:px-3"
      >
        <Globe2 className="size-4" aria-hidden="true" />
        <span className="min-w-5 text-center">{activeLanguage.shortLabel}</span>
        <ChevronDown className={["size-3.5 transition", open ? "rotate-180" : ""].join(" ")} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 overflow-hidden rounded-md border border-silver-200 bg-white p-1 text-charcoal-950 shadow-soft">
          {languages.map((item) => {
            const selected = item.code === language;

            return (
              <button
                key={item.code}
                type="button"
                aria-pressed={selected}
                data-active={selected ? "true" : undefined}
                onClick={() => {
                  setLanguage(item.code as LanguageCode);
                  setOpen(false);
                }}
                className={[
                  "interactive-surface flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm font-semibold",
                  selected ? "control-selected bg-navy-950 text-white" : "text-charcoal-900 hover:bg-silver-50"
                ].join(" ")}
              >
                <span>{cleanLabels[item.code]}</span>
                {selected ? <Check className="size-4" aria-hidden="true" /> : <span className="text-xs text-charcoal-600">{item.shortLabel}</span>}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

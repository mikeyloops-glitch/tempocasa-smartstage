"use client";

import { Languages } from "lucide-react";
import { languages, useLanguage, type LanguageCode } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="interactive-surface inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-md border border-silver-200 bg-white px-2 text-sm font-semibold text-charcoal-900 hover:border-silver-300 hover:bg-silver-50 sm:gap-2 sm:px-3">
      <Languages className="size-4 text-navy-950" aria-hidden="true" />
      <span className="sr-only">{t("app.language")}</span>
      <select
        aria-label={t("app.language")}
        className="w-12 bg-transparent text-sm font-semibold outline-none sm:w-auto"
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

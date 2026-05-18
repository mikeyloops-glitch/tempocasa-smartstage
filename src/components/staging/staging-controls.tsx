"use client";

import { Armchair, BedDouble, Bath, CheckCircle2, CookingPot, Home, Hotel, LampDesk, Utensils } from "lucide-react";
import { roomTypes, stagingLevels, stagingStyles } from "@/lib/staging-options";
import { Button } from "@/components/ui/button";
import type { RoomType, StagingLevel, StagingStyle } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type StagingControlsProps = {
  roomType: RoomType;
  style: StagingStyle;
  stagingLevel: StagingLevel;
  isConfigurationDirty?: boolean;
  onRoomTypeChange: (value: RoomType) => void;
  onStyleChange: (value: StagingStyle) => void;
  onStagingLevelChange: (value: StagingLevel) => void;
  onApplyConfiguration?: () => void;
};

const roomIcons = {
  "Living Room": Armchair,
  Lounge: Armchair,
  "Living Room + Kitchen": Utensils,
  Bedroom: BedDouble,
  Kitchen: CookingPot,
  Bathroom: Bath,
  "Studio Apartment": Home,
  "Dining Room": Utensils,
  "Home Office": LampDesk,
  Entryway: Home,
  "Balcony / Terrace": Armchair,
  Garden: Home
};

const styleIcons = {
  "Luxury Modern": Hotel,
  Scandinavian: LampDesk,
  Minimalist: Home,
  Contemporary: Armchair,
  "Luxury Airbnb": BedDouble,
  Mediterranean: Utensils,
  "High-End Penthouse": Hotel,
  Japandi: LampDesk,
  "Outdoor Luxury": Armchair,
  "Family Rental Ready": Home
};

export function StagingControls({
  roomType,
  style,
  stagingLevel,
  isConfigurationDirty = false,
  onRoomTypeChange,
  onStyleChange,
  onStagingLevelChange,
  onApplyConfiguration
}: StagingControlsProps) {
  const { t, labelRoom, labelStyle, labelLevel } = useLanguage();

  return (
    <div className="space-y-6 sm:space-y-7">
      <fieldset>
        <legend className="text-sm font-semibold text-navy-950">{t("staging.roomType")}</legend>
        <div className="mt-3 grid grid-cols-1 gap-2 2xl:grid-cols-2">
          {roomTypes.map((item) => {
            const Icon = roomIcons[item];
            const selected = item === roomType;

            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                data-active={selected ? "true" : undefined}
                className={cn(
                  "interactive-surface flex min-h-14 min-w-0 items-center gap-3 rounded-md border px-3 py-3 text-left text-base font-medium leading-tight sm:min-h-12 sm:py-2 sm:text-[0.95rem]",
                  selected
                    ? "control-selected border-navy-950 bg-navy-950 text-white"
                    : "border-silver-200 bg-white text-charcoal-900 hover:border-silver-300 hover:bg-silver-50"
                )}
                onClick={() => onRoomTypeChange(item)}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="fit-label">{labelRoom(item)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-navy-950">{t("staging.style")}</legend>
        <div className="mt-3 grid grid-cols-1 gap-2 2xl:grid-cols-2">
          {stagingStyles.map((item) => {
            const Icon = styleIcons[item];
            const selected = item === style;

            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                data-active={selected ? "true" : undefined}
                className={cn(
                  "interactive-surface flex min-h-14 min-w-0 items-center gap-3 rounded-md border px-3 py-3 text-left text-base font-medium leading-tight sm:min-h-12 sm:py-2 sm:text-[0.95rem]",
                  selected
                    ? "control-selected border-navy-950 bg-navy-950 text-white"
                    : "border-silver-200 bg-white text-charcoal-900 hover:border-silver-300 hover:bg-silver-50"
                )}
                onClick={() => onStyleChange(item)}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="fit-label">{labelStyle(item)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-navy-950">{t("staging.level")}</legend>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-md border border-silver-200 bg-white p-1">
          {stagingLevels.map((item) => {
            const selected = item === stagingLevel;

            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                data-active={selected ? "true" : undefined}
                className={cn(
                  "interactive-surface min-h-12 min-w-0 rounded-sm px-2 text-[0.95rem] font-semibold leading-tight sm:min-h-10 sm:text-sm",
                  selected ? "control-selected bg-navy-950 text-white shadow-panel" : "text-charcoal-800 hover:bg-silver-50"
                )}
                onClick={() => onStagingLevelChange(item)}
              >
                <span className="fit-label">{labelLevel(item)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-md border border-silver-200 bg-silver-50 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-champagne-500 sm:tracking-[0.18em]">{t("staging.selected")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[labelRoom(roomType), labelStyle(style), labelLevel(stagingLevel)].map((item) => (
                <span key={item} className="fit-label rounded-sm border border-silver-200 bg-white px-2 py-1 text-sm font-semibold leading-tight text-navy-950 sm:text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={!isConfigurationDirty}
            onClick={onApplyConfiguration}
            variant={isConfigurationDirty ? "primary" : "secondary"}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <span className="fit-label">{isConfigurationDirty ? t("button.applyConfiguration") : t("button.applied")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

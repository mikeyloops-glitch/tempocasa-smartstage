import { cn } from "@/lib/utils";

export function TempoCasaLogo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid size-10 place-items-center rounded-md border border-white/25 bg-navy-950 text-white shadow-panel">
        <svg viewBox="0 0 48 48" className="size-7" aria-hidden="true">
          <circle cx="24" cy="24" r="18" fill="white" />
          <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M16 24.5 24 17l8 7.5v8.5H18.5v-6h11v6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 24V15M24 24h8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      {!markOnly ? (
        <div className="leading-none">
          <p className="text-[1.25rem] font-extrabold tracking-normal text-current">TEMPOCASA</p>
          <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-current/70">
            AI SmartStage
          </p>
        </div>
      ) : null}
    </div>
  );
}

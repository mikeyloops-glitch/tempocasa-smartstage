"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Download, Layers3, Route, Sparkles, UploadCloud } from "lucide-react";
import { TempoCasaLogo } from "@/components/brand/tempocasa-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { BeforeAfterSlider } from "@/components/staging/before-after-slider";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const proofPointKeys = ["landing.proof.architecture", "landing.proof.photography", "landing.proof.safe", "landing.proof.cdn"];

const workflow = [
  {
    icon: UploadCloud,
    titleKey: "landing.workflow.upload.title",
    textKey: "landing.workflow.upload.text"
  },
  {
    icon: Layers3,
    titleKey: "landing.workflow.control.title",
    textKey: "landing.workflow.control.text"
  },
  {
    icon: Sparkles,
    titleKey: "landing.workflow.stage.title",
    textKey: "landing.workflow.stage.text"
  },
  {
    icon: Download,
    titleKey: "landing.workflow.export.title",
    textKey: "landing.workflow.export.text"
  }
];

export function LandingPage() {
  const clerkReady = isClerkConfigured();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-silver-50 text-charcoal-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-navy-950/75 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link aria-label="TEMPOCASA SMARTSTAGE home" href="/" className="min-w-0">
            <TempoCasaLogo className="hidden sm:flex" />
            <TempoCasaLogo className="sm:hidden" markOnly />
          </Link>
          <nav className="flex items-center gap-2">
            <LanguageSelector />
            <Button asChild variant="secondary" className="hidden border-white/20 bg-white/10 text-white hover:bg-white/20 md:inline-flex">
              <Link href="/virtual-tour">
                <Route className="size-4" aria-hidden="true" />
                {t("landing.nav.virtualTour")}
              </Link>
            </Button>
            {clerkReady ? (
              <>
                <SignedOut>
                  <Button asChild variant="secondary" className="hidden bg-white/95 text-navy-950 sm:inline-flex">
                    <Link href="/login">{t("landing.nav.login")}</Link>
                  </Button>
                  <Button asChild className="bg-white text-navy-950 hover:bg-silver-100">
                    <Link href="/login">
                      {t("landing.nav.launch")}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button asChild className="bg-white text-navy-950 hover:bg-silver-100">
                    <Link href="/dashboard">{t("landing.nav.dashboard")}</Link>
                  </Button>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            ) : (
              <Button asChild className="bg-white text-navy-950 hover:bg-silver-100">
                <Link href="/dashboard">
                  {t("button.demo")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative min-h-[88svh] overflow-hidden bg-navy-950 text-white">
        <Image
          src="/assets/smartstage-hero.png"
          alt="Luxury apartment before and after AI virtual staging"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,31,0.88),rgba(7,17,31,0.55)_42%,rgba(7,17,31,0.18))]" />
        <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-7xl items-center px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-champagne-300">
              {t("landing.hero.kicker")}
            </p>
            <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-normal sm:text-6xl lg:text-7xl">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-silver-100 sm:text-xl">
              {t("landing.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-navy-950 hover:bg-silver-100">
                <Link href="/dashboard">
                  {t("landing.hero.smartstage")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                <Link href="/virtual-tour">
                  {t("landing.hero.tour")}
                  <Route className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="mt-9 grid max-w-3xl gap-3 sm:grid-cols-2">
              {proofPointKeys.map((pointKey) => (
                <div key={pointKey} className="flex items-center gap-2 text-sm text-silver-100">
                  <CheckCircle2 className="size-4 text-champagne-300" aria-hidden="true" />
                  <span>{t(pointKey)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="showcase" className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-champagne-500">{t("landing.showcase.kicker")}</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight tracking-normal text-navy-950 sm:text-5xl">
              {t("landing.showcase.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-charcoal-800">
              {t("landing.showcase.body")}
            </p>
          </div>
          <BeforeAfterSlider
            beforeSrc="/assets/smartstage-demo-before.png"
            afterSrc="/assets/smartstage-demo-after.png"
            beforeAlt="Empty Italian apartment before virtual staging"
            afterAlt="Luxury staged Italian apartment after AI virtual staging"
            tone="light"
          />
        </div>
      </section>

      <section className="bg-silver-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-champagne-500">{t("landing.workflow.kicker")}</p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-normal text-navy-950 sm:text-5xl">
              {t("landing.workflow.title")}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item) => (
              <motion.article
                key={item.titleKey}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45 }}
                className="rounded-md border border-silver-200 bg-white p-5 shadow-panel"
              >
                <div className="grid size-11 place-items-center rounded-md bg-navy-950 text-white">
                  <item.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy-950">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal-800">{t(item.textKey)}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

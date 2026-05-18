"use client";

import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { TempoCasaLogo } from "@/components/brand/tempocasa-logo";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/auth";

export function LoginScreen() {
  const clerkReady = isClerkConfigured();

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950 text-white">
      <Image
        src="/assets/smartstage-after.png"
        alt="Luxury staged real estate interior"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(7,17,31,0.96),rgba(7,17,31,0.84)_48%,rgba(7,17,31,0.58))]" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
        <section className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Back to home">
              <TempoCasaLogo />
            </Link>
            <Button asChild variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Home
              </Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="max-w-2xl pb-10 pt-20 lg:pb-20"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-3 py-2 text-sm text-silver-100">
              <ShieldCheck className="size-4 text-champagne-300" aria-hidden="true" />
              Secure workspace for listing teams
            </div>
            <h1 className="font-display text-5xl leading-[0.98] tracking-normal sm:text-6xl">
              Luxury virtual staging, governed from the first upload.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-silver-100">
              Access the Tempocasa staging workspace for project history, architecture-aware AI edits, and listing-ready downloads.
            </p>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
          className="flex items-center justify-center pb-10 lg:pb-0"
        >
          <div className="w-full max-w-[460px] rounded-md border border-white/20 bg-white p-4 text-charcoal-950 shadow-soft sm:p-6">
            {clerkReady ? (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "shadow-none border-0 w-full",
                    card: "shadow-none border-0 p-0",
                    headerTitle: "font-display text-3xl tracking-normal text-navy-950",
                    headerSubtitle: "text-charcoal-800",
                    formButtonPrimary: "bg-navy-950 hover:bg-navy-800 text-white rounded-md",
                    footerActionLink: "text-navy-900 font-semibold",
                    formFieldInput: "rounded-md border-silver-200 focus:border-navy-900 focus:ring-navy-900"
                  }
                }}
                routing="path"
                path="/login"
                signUpUrl="/login"
                forceRedirectUrl="/dashboard"
              />
            ) : (
              <div className="p-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-champagne-500">Demo Mode</p>
                <h2 className="mt-4 font-display text-4xl leading-tight tracking-normal text-navy-950">
                  SmartStage preview is ready.
                </h2>
                <p className="mt-4 text-sm leading-6 text-charcoal-800">
                  Add real Clerk keys when you want secure sign-in. For the pre-release demo, continue straight to the workspace.
                </p>
                <Button asChild className="mt-6 w-full">
                  <Link href="/dashboard">Enter Dashboard</Link>
                </Button>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/lib/i18n";
import { isClerkConfigured } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "TEMPOCASA SMARTSTAGE",
  description: "AI-powered virtual staging for luxury Italian real-estate professionals.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TC SmartStage",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/assets/app-icon.svg",
    apple: "/assets/app-icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#004b33",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const page = (
    <html lang="it" data-scroll-behavior="smooth">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );

  if (!isClerkConfigured()) {
    return page;
  }

  return (
    <ClerkProvider>
      {page}
    </ClerkProvider>
  );
}

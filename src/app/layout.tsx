import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";
import { PwaRegister } from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { env } from "@/config/env";
import {
  SITE_DESCRIPTION,
  SITE_ICON_URL,
  SITE_LOGO_URL,
  SITE_NAME,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: SITE_ICON_URL, type: "image/x-icon" }],
    shortcut: [{ url: SITE_ICON_URL, type: "image/x-icon" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  openGraph: {
    siteName: SITE_NAME,
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: SITE_LOGO_URL,
        width: 1435,
        height: 279,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#0053c6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col"
      >
        <Suspense fallback={null}>
          <TooltipProvider>
            {children}
            <MobileBottomNavigation />
            <Toaster richColors />
            <PwaRegister />
          </TooltipProvider>
        </Suspense>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation";
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
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: SITE_ICON_URL, type: "image/svg+xml" }],
    shortcut: [{ url: SITE_ICON_URL, type: "image/svg+xml" }],
    apple: [{ url: SITE_ICON_URL, type: "image/svg+xml" }],
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
        <TooltipProvider>
          {children}
          <MobileBottomNavigation />
          <Toaster richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}

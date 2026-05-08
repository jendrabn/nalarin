import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nalarin.id"),
  title: {
    default: "Nalarin",
    template: "%s | Nalarin",
  },
  description:
    "Nalarin adalah platform persiapan UTBK, UTUL UGM, dan SIMAK UI dengan latihan, quiz, tryout, ranking, pembahasan, dan progress belajar.",
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
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}

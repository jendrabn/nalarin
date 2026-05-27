import type { Metadata } from "next";

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Kontak Nalarin.id",
  description:
    "Hubungi tim Nalarin.id untuk bantuan akun, pembayaran, kerja sama, atau pertanyaan seputar latihan dan tryout.",
  alternates: {
    canonical: "/contact",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function Page() {
  return <RoutePlaceholder section="Public" route="/contact" />;
}

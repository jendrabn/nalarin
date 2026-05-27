import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/components/auth-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Daftar Nalarin.id",
  description:
    "Buat akun Nalarin.id untuk mulai latihan gratis, ikut tryout, dan memantau progres belajar.",
  path: "/register",
  noIndex: true,
});

export default function Page() {
  return <AuthPage />;
}

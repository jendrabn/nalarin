import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/components/auth-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Masuk ke Nalarin.id",
  description:
    "Masuk ke akun Nalarin.id untuk mengakses latihan, tryout, pembahasan, dan progres belajar.",
  path: "/login",
  noIndex: true,
});

export default function Page() {
  return <AuthPage />;
}

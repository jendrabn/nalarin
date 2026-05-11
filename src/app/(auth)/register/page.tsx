import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/components/auth-page";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Daftar akun Nalarin.id dengan Google dan mulai latihan gratis.",
  alternates: {
    canonical: "/register",
  },
};

export default function Page() {
  return <AuthPage />;
}

import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/pages/auth-page";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk atau buat akun Nalarin.id dengan Google.",
  alternates: {
    canonical: "/login",
  },
};

export default function Page() {
  return <AuthPage />;
}

import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminPanelLayout } from "@/components/layouts/admin-panel-layout";
import { requireAdmin } from "@/features/auth/services/session";

export const metadata: Metadata = {
  title: "Admin Panel",
  description:
    "Panel admin Nalarin.id untuk mengelola user, billing, bank soal, practice, materi, tryout, dan blog.",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdmin();
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AdminPanelLayout
      defaultSidebarOpen={defaultSidebarOpen}
      user={{
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }}
    >
      {children}
    </AdminPanelLayout>
  );
}

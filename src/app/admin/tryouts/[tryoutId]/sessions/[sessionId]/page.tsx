import type { Metadata } from "next"

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Tryout Session Details",
  description: "Review tryout session details to inspect timing, answers, and scoring.",
}

export default function Page() {
  return (
    <RoutePlaceholder
      section="Admin"
      route="/admin/tryouts/[tryoutId]/sessions/[sessionId]"
    />
  );
}


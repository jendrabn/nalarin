import type { Metadata } from "next"

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Practice Session Details",
  description: "Review practice session details to inspect timing, answers, and scoring.",
}

export default function Page() {
  return (
    <RoutePlaceholder
      section="Admin"
      route="/admin/practice-sessions/[sessionId]"
    />
  );
}


import type { Metadata } from "next"

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Practice Sessions",
  description: "Review practice sessions to inspect attempts, status, and grading progress.",
}

export default function Page() {
  return <RoutePlaceholder section="Admin" route="/admin/practice-sessions" />;
}


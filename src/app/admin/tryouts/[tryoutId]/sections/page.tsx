import type { Metadata } from "next"

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Tryout Sections",
  description: "View tryout sections.",
}

export default function Page() {
  return (
    <RoutePlaceholder
      section="Admin"
      route="/admin/tryouts/[tryoutId]/sections"
    />
  );
}


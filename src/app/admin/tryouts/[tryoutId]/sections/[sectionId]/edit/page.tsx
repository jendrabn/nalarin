import type { Metadata } from "next"

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Edit Tryout Section",
  description: "Edit a tryout section.",
}

export default function Page() {
  return (
    <RoutePlaceholder
      section="Admin"
      route="/admin/tryouts/[tryoutId]/sections/[sectionId]/edit"
    />
  );
}


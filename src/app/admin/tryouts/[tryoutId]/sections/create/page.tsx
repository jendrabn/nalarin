import type { Metadata } from "next"

import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export const metadata: Metadata = {
  title: "Create Tryout Section",
  description: "Create a tryout section.",
}

export default function Page() {
  return (
    <RoutePlaceholder
      section="Admin"
      route="/admin/tryouts/[tryoutId]/sections/create"
    />
  );
}


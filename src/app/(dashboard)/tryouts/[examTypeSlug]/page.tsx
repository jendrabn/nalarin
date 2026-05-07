import { RoutePlaceholder } from "@/app/_lib/route-placeholder";

export default function Page() {
  return (
    <RoutePlaceholder
      section="Dashboard"
      route="/tryouts/[examTypeSlug]"
    />
  );
}

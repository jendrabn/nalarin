import Link from "next/link";

import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
};

export function SiteLogo({ className }: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "font-heading text-[2rem] font-bold leading-none tracking-normal text-primary",
        className
      )}
    >
      nalarin
    </Link>
  );
}

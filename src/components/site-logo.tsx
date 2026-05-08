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
        "inline-flex items-baseline font-logo text-[2rem] font-bold leading-none tracking-normal text-primary",
        className
      )}
    >
      <span>nalarin</span>
      <span className="text-[0.52em] leading-none font-semibold text-brand-ink">
        .ID
      </span>
    </Link>
  );
}

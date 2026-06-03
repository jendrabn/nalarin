import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

const logoSources = {
  full: {
    src: "/images/brand/logo-nalarin.svg",
    width: 1435,
    height: 279,
    className: "h-8 w-[10.25rem]",
  },
  initial: {
    src: "/images/brand/logo-initial-nalarin.svg",
    width: 425,
    height: 425,
    className: "size-9",
  },
};

type SiteLogoProps = {
  className?: string;
  variant?: keyof typeof logoSources;
};

export function SiteLogo({ className, variant = "full" }: SiteLogoProps) {
  const logo = logoSources[variant];

  return (
    <Link
      href="/"
      className={cn(
        "relative inline-flex shrink-0 items-center text-foreground transition-opacity hover:opacity-85",
        logo.className,
        className
      )}
      aria-label="Nalarin.id"
    >
      <Image
        src={logo.src}
        alt=""
        width={logo.width}
        height={logo.height}
        unoptimized
        className="size-full object-contain dark:opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-foreground dark:block"
        style={{
          WebkitMaskImage: `url(${logo.src})`,
          maskImage: `url(${logo.src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </Link>
  );
}

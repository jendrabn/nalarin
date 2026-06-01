import type { ComponentProps } from "react"
import { CrownIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type PremiumBadgeProps = Omit<ComponentProps<typeof Badge>, "children" | "variant"> & {
  showIcon?: boolean
}

export function PremiumBadge({
  className,
  showIcon = false,
  size = "sm",
  ...props
}: PremiumBadgeProps) {
  return (
    <Badge
      variant="outline"
      size={size}
      className={cn(
        "shrink-0 rounded-full border-chart-3 bg-chart-3 font-semibold text-primary-foreground hover:bg-chart-3",
        className,
      )}
      {...props}
    >
      {showIcon ? <CrownIcon data-icon="inline-start" /> : null}
      Premium
    </Badge>
  )
}

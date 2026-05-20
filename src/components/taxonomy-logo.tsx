import Image from "next/image"
import { ImageIcon } from "lucide-react"

type TaxonomyLogoProps = {
  src: string | null
  alt?: string
}

export function TaxonomyLogo({ src, alt = "" }: TaxonomyLogoProps) {
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted/35 text-muted-foreground [&_svg]:size-4">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={36}
          height={36}
          unoptimized
          className="size-full object-contain"
        />
      ) : (
        <ImageIcon />
      )}
    </span>
  )
}

"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import {
  PricingPlanCards,
  type PricingPlanCardItem,
} from "@/components/pricing-plan-cards"
import { Button } from "@/components/ui/button"

type PricingPlansSliderProps = {
  plans: PricingPlanCardItem[]
}

export function PricingPlansSlider({ plans }: PricingPlansSliderProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        containScroll: "trimSnaps",
      }}
      className="w-full"
    >
      <PricingSliderControls />

      <CarouselContent className="-ml-4 pb-4">
        {plans.map((plan) => (
          <CarouselItem
            key={plan.plan.priceId}
            className="basis-[88%] sm:basis-[58%] lg:basis-[42%] xl:basis-1/3"
          >
            <PricingPlanCards
              plans={[plan]}
              className="h-full grid-cols-1 gap-0 pt-0 md:grid-cols-1 xl:grid-cols-1"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}

function PricingSliderControls() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()

  return (
    <div className="mb-5 flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Paket sebelumnya"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Paket berikutnya"
        disabled={!canScrollNext}
        onClick={scrollNext}
      >
        <ArrowRightIcon />
      </Button>
    </div>
  )
}

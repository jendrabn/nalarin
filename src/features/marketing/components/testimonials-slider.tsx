"use client";

import { useRef } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  QuoteIcon,
  StarIcon,
} from "lucide-react";

import testimonials from "@/features/marketing/data/testimonials.json";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";

export function TestimonialsSlider() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: "prev" | "next") {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction === "next" ? track.clientWidth : -track.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <section id="ulasan" className="bg-background py-20 sm:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Ulasan Pejuang PTN</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Belajar Terasa Lebih Terarah
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Cerita singkat dari pelajar yang ingin membangun kebiasaan
              latihan lebih konsisten sebelum hari ujian.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Ulasan sebelumnya"
              onClick={() => scrollByPage("prev")}
            >
              <ArrowLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Ulasan berikutnya"
              onClick={() => scrollByPage("next")}
            >
              <ArrowRightIcon />
            </Button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="-mx-4 grid auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:auto-cols-[46%] lg:auto-cols-[calc((100%-2rem)/3)] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="min-h-72 snap-start rounded-lg border-transparent bg-card/95 shadow-lg shadow-primary/10 ring-1 ring-foreground/5"
            >
              <CardContent className="flex flex-1 flex-col gap-6 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <QuoteIcon />
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <StarIcon key={index} className="fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-base leading-7 text-foreground/85">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-auto flex items-center gap-3 border-t pt-5">
                  <Avatar className="size-11">
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">
                      {testimonial.name}
                    </CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

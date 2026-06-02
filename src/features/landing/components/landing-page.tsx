import Link from "next/link";
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PricingPlanCards } from "@/components/pricing-plan-cards";
import { getPricingPlanViews } from "@/lib/pricing-plans";
import { cn } from "@/lib/utils";
import { SiteNavbar, type SiteUser } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { TestimonialsSlider } from "@/components/testimonials-slider";
import { faqs } from "@/features/landing/data";
import {
  featureHighlights,
  howItWorks,
  trustBadges,
} from "@/features/landing/data";

const softCardClass =
  "rounded-lg bg-card shadow-lg shadow-primary/5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10";

export async function LandingPage({ user }: { user: SiteUser }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={user} />
      <main>
        <HeroSection />
        <FeatureHighlightsSection />
        <TestimonialsSlider />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b bg-background">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.68)_18%,transparent_42%,transparent_76%,rgba(255,255,255,0.5))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02)_18%,transparent_42%,transparent_76%,rgba(255,255,255,0.02))]" />
      <div className="absolute left-[-18rem] top-[-8rem] -z-10 h-[26rem] w-[38rem] rotate-[-8deg] rounded-[999px] bg-primary/8 blur-3xl sm:h-[30rem] sm:w-[46rem]" />
      <div className="absolute right-[-20rem] top-[-5rem] -z-10 h-[24rem] w-[36rem] rotate-[10deg] rounded-[999px] bg-accent/18 blur-3xl sm:h-[28rem] sm:w-[44rem]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-12 left-8 top-24 -z-10 hidden w-px bg-gradient-to-b from-transparent via-border/80 to-transparent xl:block" />
      <div className="absolute bottom-12 right-8 top-24 -z-10 hidden w-px bg-gradient-to-b from-transparent via-border/80 to-transparent xl:block" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent via-background/70 to-background" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col items-center justify-center gap-12 px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
        <div className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:flex sm:text-[0.76rem]">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className={cn(
                "inline-flex items-center gap-2",
                "after:ml-4 after:hidden after:h-px after:w-6 after:bg-border sm:after:block last:after:hidden"
              )}
            >
              <badge.icon className="size-3.5 text-primary" />
              {badge.label}
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
            <PageHeader
              align="center"
              className="mb-0"
              title={
                <>
                  Belajar Pakai Nalar, Siap Hadapi{" "}
                  <span className="text-primary">Seleksi PTN</span>
                </>
              }
              subtitle="Persiapkan seleksi PTN dengan alur belajar yang terarah melalui latihan fokus, tryout berkala, dan evaluasi hasil yang mudah ditindaklanjuti."
              titleClassName="mx-auto max-w-4xl text-balance text-[3.25rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3.95rem] lg:text-[4.45rem]"
              subtitleClassName="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg"
            />
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="cta"
              className="h-12 px-5 text-base has-data-[icon=inline-end]:pr-5"
              asChild
            >
              <Link href="/register">
                Mulai Gratis
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button className="hidden h-12 px-5 text-base sm:inline-flex" variant="outline" asChild>
              <Link href="/tryouts">Lihat Tryout</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureHighlightsSection() {
  return (
    <section id="fitur" className="border-y bg-secondary/60 py-20 sm:py-24">
      <SectionHeading
        eyebrow="Fitur Utama"
        title="Belajar Dengan Alur Yang Bisa Diukur"
        description="Nalarin menyatukan latihan, quiz, tryout, review, dan progres agar setiap sesi belajar punya tindak lanjut."
      />
      <div className="mx-auto mt-10 grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {featureHighlights.map((feature) => (
          <Card
            key={feature.title}
            className={softCardClass}
          >
            <CardHeader className="min-h-48 gap-2.5 p-5 sm:p-6">
              <div className="mb-1 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <feature.icon />
              </div>
              <CardTitle className="text-[1.05rem] leading-snug">
                {feature.title}
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="border-y bg-secondary/60 py-20 sm:py-24">
      <SectionHeading
        eyebrow="Cara Kerja"
        title="Dari Target Tes Ke Review Yang Bisa Ditindaklanjuti"
        description="Pilih target, mulai latihan, lalu gunakan hasil review untuk menentukan prioritas belajar berikutnya."
      />
      <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {howItWorks.map((step, index) => (
          <div
            key={step.title}
            className="relative min-h-56 rounded-lg bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15">
                {String(index + 1).padStart(2, "0")}
              </div>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

async function PricingSection() {
  const plans = (await getPricingPlanViews()).slice(0, 3).map((plan) => ({
    plan,
    featured: plan.discountPercent > 0,
    action: {
      label: `Pilih ${plan.name}`,
      href: "/pricing",
      variant: plan.discountPercent > 0 ? "cta" as const : "outline" as const,
    },
  }));

  return (
    <section id="pricing" className="bg-background py-20 sm:py-24">
      <SectionHeading
        eyebrow="Paket Belajar"
        title="Mulai Gratis, Upgrade Saat Butuh Akses Lebih Luas"
        description="Pilih akses belajar sesuai ritme persiapanmu, dari latihan dasar sampai tryout intensif dengan pembahasan penuh."
      />
      <div className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingPlanCards plans={plans} />
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="border-y bg-secondary/60 py-20 sm:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Pertanyaan Yang Sering Muncul
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Jawaban ringkas untuk akses plan, tryout, pembahasan, dan pembayaran.
          </p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="flex flex-col rounded-2xl bg-card/85 px-5 shadow-lg shadow-primary/5 ring-1 ring-foreground/5 backdrop-blur-sm sm:px-6"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${index}`}
              className="border-b border-border/70 px-0 last:border-b-0"
            >
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-6 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-secondary/70 px-6 py-12 text-center shadow-xl shadow-primary/5 ring-1 ring-foreground/5 sm:px-10 sm:py-14">
          <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
            <ShieldCheckIcon />
            Mulai Dari Akses Gratis
          </Badge>
          <h2 className="mx-auto mt-5 max-w-3xl text-balance text-3xl font-bold tracking-normal sm:text-5xl">
            Bangun Ritme Belajar Lebih Rapi Mulai Hari Ini
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Daftar gratis, coba latihan awal, lalu upgrade saat butuh tryout,
            ranking, dan pembahasan penuh.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="cta" className="h-12 px-5 text-base" asChild>
              <Link href="/register">Daftar Gratis</Link>
            </Button>
            <Button className="h-12 px-5 text-base" variant="outline" asChild>
              <Link href="/practices">Mulai Latihan</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-normal sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}


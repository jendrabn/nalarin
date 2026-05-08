import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { PLAN_CONFIG, type PlanCode } from "@/config/plans";
import { SiteLogo } from "@/components/site-logo";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MarketingNavbar, type MarketingUser } from "./marketing-navbar";
import { TestimonialsSlider } from "./testimonials-slider";
import faqs from "@/features/marketing/data/faqs.json";
import {
  featureHighlights,
  footerGroups,
  howItWorks,
  pricingBullets,
  trustBadges,
} from "@/features/marketing/data/landing-content";

const currentUser: MarketingUser = null;
const softCardClass =
  "rounded-lg bg-card shadow-lg shadow-primary/5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar user={currentUser} />
      <main>
        <HeroSection />
        <FeatureHighlightsSection />
        <TestimonialsSlider />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
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
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[0.76rem]">
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
          <h1 className="mx-auto max-w-4xl text-balance text-[3.25rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3.95rem] lg:text-[4.45rem]">
            Belajar Pakai Nalar, Siap Hadapi{" "}
            <span className="text-primary">Seleksi PTN</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Latihan soal, quiz bertimer, tryout rutin, pembahasan, ranking, dan
            progress belajar dalam satu platform untuk UTBK, UTUL UGM, dan SIMAK
            UI.
          </p>
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

function PricingSection() {
  const plans = Object.values(PLAN_CONFIG);

  return (
    <section id="pricing" className="bg-background py-20 sm:py-24">
      <SectionHeading
        eyebrow="Paket Belajar"
        title="Mulai Gratis, Upgrade Saat Butuh Akses Lebih Luas"
        description="Pilih akses belajar sesuai ritme persiapanmu, dari latihan dasar sampai tryout intensif dengan pembahasan penuh."
      />
      <div className="mx-auto mt-10 grid w-full max-w-7xl grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {plans.map((plan) => {
          const isFeatured = plan.code === "pro";
          const bullets = pricingBullets[plan.code as PlanCode];

          return (
            <Card
              key={plan.code}
              className={`relative rounded-lg bg-card shadow-xl shadow-primary/5 ring-1 ring-foreground/10 ${
                isFeatured
                  ? "scale-[1.02] bg-primary/[0.03] shadow-primary/15 ring-2 ring-primary"
                  : "transition-all hover:-translate-y-0.5 hover:shadow-primary/10"
              }`}
            >
              <CardHeader className="gap-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                </div>
                <CardDescription className="min-h-10 leading-6">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6 px-6 pb-6">
                <div>
                  <p className="text-4xl font-bold tracking-normal">
                    {formatPrice(plan.price)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.durationDays ? "per bulan" : "permanen"}
                  </p>
                </div>
                <Separator />
                <ul className="flex flex-col gap-3.5">
                  {bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-sm leading-6"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckIcon className="size-3.5" />
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn("mt-auto h-12 w-full px-5 text-base")}
                  variant={isFeatured ? "cta" : "outline"}
                  asChild
                >
                  <Link href={plan.code === "free" ? "/register" : `/checkout/${plan.code}`}>
                    {plan.code === "free" ? "Mulai Gratis" : `Pilih ${plan.name}`}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
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
          className="flex flex-col"
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

function MarketingFooter() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <SiteLogo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Platform persiapan UTBK, UTUL UGM, dan SIMAK UI dengan latihan
            soal, tryout, ranking, pembahasan, dan progress belajar.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; 2026 Nalarin.id. Semua hak dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Syarat
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privasi
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Kontak
            </Link>
          </div>
        </div>
      </div>
    </footer>
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

function formatPrice(price: number) {
  if (price === 0) {
    return "Rp0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

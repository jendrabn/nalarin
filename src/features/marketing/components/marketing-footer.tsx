import Link from "next/link";

import { SiteLogo } from "@/components/site-logo";
import { footerGroups } from "@/features/marketing/data/landing-content";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <SiteLogo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Platform persiapan UTBK, UTUL UGM, SIMAK UI, dan CPNS dengan latihan
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

import Link from "next/link";

import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import {
  AppleIcon,
  FacebookIcon,
  GoogleIcon,
} from "@/features/auth/components/provider-icons";

export function AuthEntryCard() {
  return (
    <div className="w-full max-w-[25rem] px-5">
      <div className="flex flex-col items-center text-center">
        <SiteLogo className="text-[2.25rem]" />
        <h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Selamat Datang di Nalarin
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Masuk untuk melanjutkan belajar, atau daftar untuk mulai dari awal.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <form action="/api/auth/google" method="GET">
          <Button
            type="submit"
            variant="outline"
            className="relative h-12 w-full justify-center px-4 text-center text-base"
          >
            <span className="absolute left-4 flex items-center">
              <GoogleIcon />
            </span>
            <span>Lanjutkan dengan Google</span>
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          disabled
          className="relative h-12 w-full justify-center px-4 text-center text-base"
        >
          <span className="absolute left-4 flex items-center">
            <FacebookIcon />
          </span>
          <span>Lanjutkan dengan Facebook</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled
          className="relative h-12 w-full justify-center px-4 text-center text-base"
        >
          <span className="absolute left-4 flex items-center">
            <AppleIcon />
          </span>
          <span>Lanjutkan dengan Apple</span>
        </Button>
      </div>

      <p className="mt-7 text-center text-xs leading-6 text-muted-foreground">
        Dengan menekan lanjutkan, kamu menyetujui{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">
          Ketentuan Layanan
        </Link>{" "}
        dan{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    </div>
  );
}

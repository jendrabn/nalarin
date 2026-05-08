"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const errorMessages: Record<string, string> = {
  account_inactive: "Akun tidak aktif. Hubungi admin jika ini keliru.",
  auth_failed: "Login Google gagal. Coba lagi beberapa saat.",
  google_account_mismatch: "Akun Google ini tidak cocok dengan akun Nalarin.",
  google_account_not_linked:
    "Email sudah terdaftar. Login dengan email/password dulu lalu hubungkan Google dari profil.",
  google_cancelled: "Login Google dibatalkan.",
  google_email_unverified: "Email Google belum terverifikasi.",
  google_redirect_uri_mismatch:
    "Redirect URI Google belum cocok. Samakan GOOGLE_REDIRECT_URI dengan yang ada di Google Cloud Console.",
  google_token_exchange_failed:
    "Pertukaran token Google gagal. Cek kembali konfigurasi OAuth.",
  invalid_oauth_state: "Sesi login tidak valid. Silakan mulai ulang.",
};

export function AuthErrorToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(errorMessages[error] ?? "Terjadi kesalahan saat login.");
  }, [error]);

  return null;
}

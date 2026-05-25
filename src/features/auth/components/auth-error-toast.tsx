"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const errorMessages: Record<string, string> = {
  account_inactive: "Akun tidak aktif. Hubungi admin jika ini keliru.",
  apple_account_mismatch: "Akun Apple ini tidak cocok dengan akun Nalarin.",
  apple_account_not_linked:
    "Email sudah terdaftar. Login dengan email/password dulu lalu hubungkan Apple dari profil.",
  apple_cancelled: "Login Apple dibatalkan.",
  apple_email_missing:
    "Apple tidak mengirim email akun. Izinkan akses email lalu coba lagi.",
  apple_email_unverified: "Email Apple belum terverifikasi.",
  apple_redirect_uri_mismatch:
    "Redirect URI Apple belum cocok. Samakan APPLE_REDIRECT_URI dengan Services ID Apple.",
  apple_token_exchange_failed:
    "Pertukaran token Apple gagal. Cek kembali konfigurasi Sign in with Apple.",
  auth_failed: "Login gagal. Coba lagi beberapa saat.",
  auth_provider_disabled: "Provider login ini sedang tidak aktif.",
  facebook_account_mismatch: "Akun Facebook ini tidak cocok dengan akun Nalarin.",
  facebook_account_not_linked:
    "Email sudah terdaftar. Login dengan email/password dulu lalu hubungkan Facebook dari profil.",
  facebook_cancelled: "Login Facebook dibatalkan.",
  facebook_email_missing:
    "Facebook tidak mengirim email akun. Izinkan akses email lalu coba lagi.",
  facebook_profile_request_failed:
    "Pengambilan profil Facebook gagal. Coba lagi beberapa saat.",
  facebook_redirect_uri_mismatch:
    "Redirect URI Facebook belum cocok. Samakan FACEBOOK_REDIRECT_URI dengan Meta App Dashboard.",
  facebook_token_exchange_failed:
    "Pertukaran token Facebook gagal. Cek kembali konfigurasi OAuth.",
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

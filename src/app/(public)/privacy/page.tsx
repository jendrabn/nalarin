import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { getCurrentUser } from "@/features/auth/services/session";
import { LegalPage } from "@/features/legal/components/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi Nalarin.id tentang data akun, sesi belajar, pembayaran, AI, cookie session, dan keamanan layanan.",
  alternates: {
    canonical: "/privacy",
  },
};

const privacySections = [
  {
    id: "data-dikumpulkan",
    title: "Data yang Kami Kumpulkan",
    description:
      "Data dikumpulkan sejauh diperlukan untuk menjalankan akun, pembelajaran, pembayaran, keamanan, dan dukungan layanan.",
    items: [
      "Data akun dari provider OAuth, seperti nama, email, ID provider, status verifikasi email, dan avatar jika tersedia.",
      "Data profil yang pengguna isi sendiri, seperti jenis kelamin, tanggal lahir, nomor telepon, bio, atau foto profil.",
      "Data sesi belajar, termasuk practice session, quiz session, tryout session, jawaban, autosave, waktu mulai, waktu submit, skor, review, ranking, dan progress tracking.",
      "Data subscription dan payment, termasuk plan yang dipilih, status pembayaran, payment gateway, bukti pembayaran manual, nominal transaksi, dan riwayat approval admin.",
      "Data teknis seperti session cookie, alamat IP, user agent, waktu akses, dan metadata lain yang membantu keamanan serta stabilitas layanan.",
    ],
  },
  {
    id: "penggunaan-data",
    title: "Cara Kami Menggunakan Data",
    items: [
      "Membuat dan mengelola akun, memverifikasi akses, menjaga session login, dan menjalankan logout secara aman.",
      "Menyediakan latihan, quiz, tryout, autosave, auto submit, scoring, pembahasan, ranking, progress, dan riwayat aktivitas belajar.",
      "Menentukan akses Free, Pro, dan Max berdasarkan subscription aktif, limit bulanan, status pembayaran, dan pengaturan konten.",
      "Memproses pembayaran melalui Midtrans atau metode manual, memverifikasi transaksi, mencegah payment pending ganda, dan menangani webhook secara idempotent.",
      "Mengirim komunikasi transaksional seperti verifikasi email, notifikasi pembayaran, atau pemberitahuan penting tentang akun dan layanan.",
      "Mendeteksi penyalahgunaan, menjaga keamanan sistem, memperbaiki bug, melakukan analitik internal, dan meningkatkan kualitas produk.",
    ],
  },
  {
    id: "ai-provider",
    title: "Data dan Fitur AI",
    items: [
      "Saat pengguna atau admin memakai fitur AI, input yang relevan dapat dikirim ke AI provider untuk menghasilkan soal, explanation, grading, atau pembahasan AI.",
      "Data yang dikirim ke AI provider dibatasi pada informasi yang diperlukan untuk menjalankan fitur tersebut.",
      "Pengguna sebaiknya tidak memasukkan data pribadi sensitif ke kolom yang dipakai untuk fitur AI kecuali benar-benar diperlukan.",
      "Hasil AI digunakan sebagai bantuan belajar dan operasional konten, bukan sebagai satu-satunya sumber kebenaran akademik.",
    ],
  },
  {
    id: "pembagian-data",
    title: "Pembagian Data dengan Pihak Ketiga",
    items: [
      "Nalarin.id dapat membagikan data terbatas kepada provider OAuth, payment gateway, email provider, AI provider, storage provider, hosting provider, atau layanan infrastruktur lain yang diperlukan untuk menjalankan platform.",
      "Data pembayaran diproses bersama payment gateway seperti Midtrans atau melalui proses manual yang diverifikasi admin.",
      "Nalarin.id tidak menjual data pribadi pengguna kepada pihak ketiga.",
      "Data dapat dibagikan jika diwajibkan oleh hukum, permintaan otoritas yang sah, atau untuk melindungi hak, keamanan, dan integritas layanan.",
    ],
  },
  {
    id: "cookie-session",
    title: "Cookie dan Session",
    items: [
      "Nalarin.id menggunakan cookie session terenkripsi untuk menjaga pengguna tetap login dan menghubungkan browser dengan session aktif di database.",
      "Session aktif memiliki masa berlaku terbatas. Aktivitas pengguna dapat memperbarui data pemantauan seperti last active, tetapi masa berlaku session mengikuti aturan produk.",
      "Cookie penting untuk auth dan keamanan tidak ditujukan untuk pelacakan iklan lintas situs.",
      "Jika pengguna menghapus cookie atau logout, akses login pada perangkat tersebut dapat berakhir dan pengguna perlu login ulang.",
    ],
  },
  {
    id: "retensi-keamanan",
    title: "Retensi dan Keamanan Data",
    items: [
      "Data akun, subscription, payment, progress, jawaban, dan konten belajar disimpan selama diperlukan untuk menjalankan layanan, memenuhi kewajiban operasional, menjaga audit transaksi, dan menyelesaikan sengketa.",
      "Nalarin.id menggunakan kontrol teknis seperti HTTP-only cookie, session token hash, validasi server-side, pembatasan akses admin, dan pencatatan status session untuk membantu menjaga keamanan.",
      "Tidak ada sistem yang sepenuhnya bebas risiko. Jika terjadi insiden keamanan yang berdampak pada data pengguna, Nalarin.id akan mengambil langkah penanganan yang wajar.",
      "Admin hanya boleh mengakses data pengguna sejauh diperlukan untuk dukungan, moderasi, manajemen payment, pengelolaan subscription, atau operasional platform.",
    ],
  },
  {
    id: "hak-pengguna",
    title: "Hak dan Pilihan Pengguna",
    items: [
      "Pengguna dapat mengakses dan memperbarui sebagian data profil melalui halaman profil.",
      "Pengguna dapat logout untuk mengakhiri session pada perangkat yang sedang digunakan.",
      "Pengguna dapat menghubungi Nalarin.id untuk meminta bantuan terkait akses akun, koreksi data, pertanyaan privasi, atau permintaan penghapusan akun sesuai batasan hukum dan operasional.",
      "Penghapusan akun atau data tertentu dapat dibatasi jika data masih diperlukan untuk catatan transaksi, keamanan, audit, penyelesaian sengketa, atau kewajiban hukum.",
    ],
  },
  {
    id: "perubahan",
    title: "Perubahan Kebijakan",
    items: [
      "Kebijakan Privasi ini dapat diperbarui mengikuti perubahan fitur, provider, regulasi, model subscription, atau kebutuhan keamanan.",
      "Perubahan penting akan diinformasikan melalui kanal yang wajar. Penggunaan layanan setelah perubahan berlaku berarti pengguna menerima versi terbaru.",
      "Versi yang berlaku adalah versi yang ditampilkan di halaman ini, kecuali dinyatakan lain secara tertulis oleh Nalarin.id.",
    ],
  },
];

export default async function Page() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={user} />
      <LegalPage
        title="Kebijakan Privasi (Privacy Policy)"
        intro="Dengan menggunakan Nalarin.id, Anda memercayakan sebagian informasi Anda kepada kami. Kebijakan Privasi ini menjelaskan data yang kami kumpulkan, alasan pengumpulannya, cara data digunakan untuk menjalankan layanan belajar, pembayaran, session, fitur AI, serta pilihan yang tersedia untuk Anda. Kami menyarankan Anda membaca dokumen ini dengan saksama."
        version="25 Mei 2026"
        sections={privacySections}
      />
      <SiteFooter />
    </div>
  );
}

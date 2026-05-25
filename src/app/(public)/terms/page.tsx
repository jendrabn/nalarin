import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { getCurrentUser } from "@/features/auth/services/session";
import { LegalPage } from "@/features/legal/components/legal-page";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan penggunaan Nalarin.id untuk akun, latihan, quiz, tryout, subscription, pembayaran, konten, dan fitur AI.",
  alternates: {
    canonical: "/terms",
  },
};

const termsSections = [
  {
    id: "ruang-lingkup",
    title: "Ruang Lingkup Layanan",
    description:
      "Dokumen ini mengatur penggunaan Nalarin.id sebagai platform persiapan tes online.",
    items: [
      "Nalarin.id menyediakan bank soal, Mode Latihan, Mode Quiz, tryout rutin, review jawaban, pembahasan, progress tracking, blog edukasi, dan fitur subscription untuk kategori UTBK, UTUL UGM, SIMAK UI, dan CPNS.",
      "Layanan disediakan untuk membantu proses belajar dan simulasi. Nalarin.id tidak menjamin kelulusan, nilai tertentu, peringkat tertentu, atau diterimanya pengguna pada institusi maupun seleksi apa pun.",
      "Dengan membuat akun, login, mengikuti latihan, mengikuti tryout, membeli plan, atau menggunakan fitur lain, pengguna dianggap memahami dan menyetujui ketentuan ini.",
    ],
  },
  {
    id: "akun",
    title: "Akun dan Akses",
    items: [
      "Pengguna bertanggung jawab atas keamanan akun, perangkat, dan akses login yang digunakan untuk masuk ke Nalarin.id.",
      "Login dan register dilakukan melalui provider OAuth yang diaktifkan oleh Nalarin.id, seperti Google, Facebook, atau Apple. Provider yang tersedia dapat berubah sesuai konfigurasi layanan.",
      "Email pengguna harus unik. Jika email dari provider sudah terdaftar tetapi belum terhubung dengan provider tersebut, sistem dapat menolak login sebagai perlindungan dari pengambilalihan akun.",
      "Nalarin.id dapat membatasi atau menonaktifkan akun yang melanggar ketentuan, menyalahgunakan layanan, mencoba mengganggu sistem, atau menggunakan data palsu.",
      "Jika pengguna belum cakap hukum, penggunaan layanan harus dilakukan dengan persetujuan orang tua atau wali.",
    ],
  },
  {
    id: "penggunaan",
    title: "Penggunaan yang Diizinkan",
    items: [
      "Pengguna boleh mengakses materi, soal, pembahasan, ranking, progress, dan fitur lain sesuai plan, status subscription, dan pengaturan konten yang berlaku.",
      "Pengguna tidak boleh membagikan akun, menjual ulang akses, menyalin massal soal, mengambil konten dengan scraping, mengunggah bukti pembayaran palsu, atau mencoba melewati pembatasan plan dan limit bulanan.",
      "Pengguna tidak boleh mengganggu autosave, timer, scoring, ranking, payment, webhook, atau mekanisme keamanan lain yang menjadi bagian dari layanan.",
      "Nalarin.id dapat memperbarui, mengarsipkan, menghapus, atau membatasi konten belajar untuk menjaga kualitas dan konsistensi layanan.",
    ],
  },
  {
    id: "plan-subscription",
    title: "Plan, Subscription, dan Limit",
    items: [
      "Nalarin.id menyediakan plan Free, Pro, dan Max. Akses setiap plan mengikuti konfigurasi fitur, limit penggunaan, harga, diskon, dan durasi yang berlaku di sistem.",
      "Jika tidak ada subscription berbayar yang aktif, pengguna dianggap memakai plan Free.",
      "Subscription Pro atau Max berlaku selama periode yang ditentukan. Saat subscription expired atau dibatalkan, akses pengguna kembali mengikuti plan Free.",
      "Pengguna hanya dapat membeli plan baru jika tidak sedang memiliki subscription berbayar aktif.",
      "Limit bulanan dapat berlaku untuk practice session, quiz session, tryout session, dan fitur AI. Sesi yang dibuat dapat tetap dihitung dalam limit walaupun kemudian dibatalkan sesuai aturan produk.",
    ],
  },
  {
    id: "pembayaran",
    title: "Pembayaran dan Pembatalan",
    items: [
      "Pembayaran dapat diproses melalui Midtrans atau metode manual yang diverifikasi oleh admin, tergantung konfigurasi layanan.",
      "Sistem dapat mencegah lebih dari satu payment pending aktif pada waktu yang sama agar transaksi tidak ganda.",
      "Payment pending dapat dibatalkan sebelum berhasil dibayar. Jika payment yang sudah dibatalkan kemudian menerima notifikasi sukses dari payment gateway, Nalarin.id dapat mengabaikan notifikasi tersebut untuk mencegah subscription ganda.",
      "Subscription aktif dibuat setelah pembayaran sukses diterima dari payment gateway atau setelah pembayaran manual disetujui admin.",
      "Kebijakan pengembalian dana, jika tersedia, ditentukan berdasarkan kondisi transaksi, status akses, dan hasil verifikasi internal Nalarin.id.",
    ],
  },
  {
    id: "fitur-belajar",
    title: "Latihan, Quiz, Tryout, dan Ranking",
    items: [
      "Mode Latihan, Mode Quiz, dan tryout memiliki aturan masing-masing terkait timer, urutan soal, autosave, submit, auto submit, scoring, review, dan pembahasan.",
      "Timer, autosave, dan auto submit menggunakan data sistem sebagai acuan. Koneksi perangkat pengguna yang tidak stabil dapat memengaruhi pengalaman penggunaan.",
      "Ranking tryout dihitung dari data session yang valid dan dapat dipengaruhi oleh skor, jumlah section yang dimulai, jumlah benar, durasi, dan waktu submit.",
      "Hasil, ranking, dan pembahasan dapat ditampilkan langsung atau dijadwalkan sesuai pengaturan konten dan akses plan.",
    ],
  },
  {
    id: "ai",
    title: "Fitur AI",
    items: [
      "Fitur AI dapat digunakan untuk generate soal, generate explanation, grading, atau pembahasan AI sesuai akses plan dan limit yang berlaku.",
      "Konten yang dihasilkan AI dapat membantu belajar, tetapi tetap dapat mengandung ketidaktepatan. Pengguna dianjurkan memeriksa ulang pembahasan dan jawaban penting.",
      "Nalarin.id dapat membatasi penggunaan AI untuk menjaga stabilitas layanan, mencegah penyalahgunaan, dan mengendalikan biaya operasional.",
    ],
  },
  {
    id: "batasan",
    title: "Batasan Tanggung Jawab",
    items: [
      "Nalarin.id berupaya menjaga layanan tetap tersedia dan akurat, tetapi gangguan teknis, maintenance, perubahan provider, kendala payment gateway, atau kendala jaringan dapat terjadi.",
      "Nalarin.id tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan, termasuk keputusan belajar, hasil seleksi, gangguan perangkat, atau kesalahan penggunaan oleh pengguna.",
      "Ketentuan ini dapat diperbarui dari waktu ke waktu. Perubahan penting akan diinformasikan melalui kanal yang wajar, dan penggunaan layanan setelah perubahan berarti pengguna menyetujui versi terbaru.",
    ],
  },
];

export default async function Page() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar user={user} />
      <LegalPage
        title="Ketentuan Layanan (Terms of Service)"
        intro="Dengan menggunakan Nalarin.id, Anda menyetujui aturan penggunaan platform ini. Ketentuan Layanan ini membantu Anda memahami hak, kewajiban, batasan akses, subscription, pembayaran, fitur belajar, dan penggunaan fitur AI di Nalarin.id. Luangkan waktu untuk membacanya dengan saksama sebelum menggunakan layanan."
        version="25 Mei 2026"
        sections={termsSections}
      />
      <SiteFooter />
    </div>
  );
}

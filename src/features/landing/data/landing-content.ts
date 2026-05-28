import {
  BarChart3Icon,
  BookOpenCheckIcon,
  CheckCircle2Icon,
  FileCheck2Icon,
  Layers3Icon,
  PenLineIcon,
  RotateCcwIcon,
  SparklesIcon,
  TargetIcon,
  TimerIcon,
  TrendingUpIcon,
  TrophyIcon,
  UniversityIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Latihan", href: "/practices" },
  { label: "Tryout", href: "/tryouts" },
  { label: "Progres", href: "/progress" },
  { label: "Paket Belajar", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

export const examCategories = [
  {
    title: "UTBK",
    description: "Latihan TPS, literasi, dan penalaran untuk jalur SNBT.",
    icon: TargetIcon,
  },
  {
    title: "UTUL UGM",
    description: "Paket soal mandiri UGM dengan ritme latihan bertahap.",
    icon: UniversityIcon,
  },
  {
    title: "SIMAK UI",
    description: "Persiapan seleksi UI dengan quiz dan review pembahasan.",
    icon: TrophyIcon,
  },
  {
    title: "CPNS",
    description: "Bank soal dasar untuk TWK, TIU, dan TKP saat sudah tersedia.",
    icon: FileCheck2Icon,
  },
];

export const featureHighlights = [
  {
    title: "Bank Soal",
    description: "Pilih soal berdasarkan topik, tingkat kesulitan, dan jenis ujian untuk belajar lebih fokus",
    icon: BookOpenCheckIcon,
  },
  {
    title: "Mode Latihan",
    description: "Kerjakan soal tanpa batas waktu dan pelajari pembahasan dengan lebih santai",
    icon: PenLineIcon,
  },
  {
    title: "Mode Quiz",
    description: "Kerjakan soal dengan durasi tertentu untuk melatih kecepatan dan ketepatan",
    icon: TimerIcon,
  },
  {
    title: "Tryout Rutin",
    description: "Simulasi tryout dengan sistem dan durasi yang dibuat menyerupai ujian asli",
    icon: Layers3Icon,
  },
  {
    title: "Ranking Dinamis",
    description: "Lihat peringkatmu dan bandingkan hasil dengan peserta lainnya secara realtime",
    icon: BarChart3Icon,
  },
  {
    title: "Review Pembahasan",
    description: "Pelajari kembali jawaban dan pembahasan setelah latihan atau tryout selesai",
    icon: RotateCcwIcon,
  },
  {
    title: "Progress Tracking",
    description: "Pantau perkembangan belajar, akurasi, dan peningkatan skor dari waktu ke waktu",
    icon: TrendingUpIcon,
  },
];

export const howItWorks = [
  {
    title: "Pilih Target Tes",
    description: "Mulai dari UTBK, UTUL UGM, atau SIMAK UI lalu pilih subject dan topik prioritas.",
  },
  {
    title: "Latihan Dengan Ritme Sendiri",
    description: "Gunakan Mode Latihan untuk memahami konsep atau Mode Quiz untuk mengukur kecepatan.",
  },
  {
    title: "Ikut Tryout dan Review",
    description: "Kerjakan tryout multi-section, lihat hasil, ranking, pembahasan, dan progres belajar.",
  },
];

export const footerGroups = [
  {
    title: "Produk",
    links: [
      { label: "Latihan", href: "/practices" },
      { label: "Tryout", href: "/tryouts" },
      { label: "Harga", href: "/pricing" },
      { label: "Progress", href: "/progress" },
    ],
  },
  {
    title: "Tes",
    links: [
      { label: "UTBK", href: "/practices/exam/utbk" },
      { label: "UTUL UGM", href: "/practices/exam/utul-ugm" },
      { label: "SIMAK UI", href: "/practices/exam/simak-ui" },
      { label: "CPNS", href: "/practices/exam/cpns" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "#faq" },
      { label: "Kontak", href: "/contact" },
      { label: "Privasi", href: "/privacy" },
    ],
  },
];

export const trustBadges = [
  { label: "Autosave Jawaban", icon: CheckCircle2Icon },
  { label: "Pembahasan AI", icon: SparklesIcon },
  { label: "Progress Tracking", icon: BarChart3Icon },
];

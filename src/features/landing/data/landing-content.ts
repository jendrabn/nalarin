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
  { label: "Premium", href: "#pricing" },
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
    title: "Bank Soal Bertahap",
    description: "Filter soal berdasarkan jenis tes, subject, dan topik supaya sesi belajar tidak melebar.",
    icon: BookOpenCheckIcon,
  },
  {
    title: "Mode Latihan",
    description: "Belajar tanpa timer dengan ruang review yang lebih santai untuk menguatkan konsep.",
    icon: PenLineIcon,
  },
  {
    title: "Mode Quiz",
    description: "Simulasi singkat dengan timer untuk melatih keputusan cepat sebelum tryout penuh.",
    icon: TimerIcon,
  },
  {
    title: "Tryout Rutin",
    description: "Multi-section dan durasi berbeda per section agar simulasi terasa lebih realistis.",
    icon: Layers3Icon,
  },
  {
    title: "Ranking Dinamis",
    description: "Urutan ranking dihitung dari skor, section yang dikerjakan, akurasi, durasi, dan waktu submit.",
    icon: BarChart3Icon,
  },
  {
    title: "Review Pembahasan",
    description: "Cek jawaban, alasan, dan pembahasan saat hasil latihan atau tryout sudah tersedia.",
    icon: RotateCcwIcon,
  },
  {
    title: "Progress Tracking",
    description: "Pantau akurasi, topik kuat, topik lemah, dan tren skor agar belajar berikutnya lebih presisi.",
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
      { label: "Harga", href: "#pricing" },
      { label: "Progress", href: "/progress" },
    ],
  },
  {
    title: "Tes",
    links: [
      { label: "UTBK", href: "/practices/utbk" },
      { label: "UTUL UGM", href: "/practices/utul-ugm" },
      { label: "SIMAK UI", href: "/practices/simak-ui" },
      { label: "CPNS", href: "/practices/cpns" },
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

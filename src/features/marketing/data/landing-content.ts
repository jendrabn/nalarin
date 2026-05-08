import {
  BarChart3Icon,
  BookOpenCheckIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  GraduationCapIcon,
  Layers3Icon,
  MedalIcon,
  PenLineIcon,
  RotateCcwIcon,
  SparklesIcon,
  TimerIcon,
} from "lucide-react";

export const navLinks = [
  { label: "Latihan", href: "/practices" },
  { label: "Tryout", href: "/tryouts" },
  { label: "Premium", href: "#pricing" },
  { label: "Blog", href: "/blog" },
];

export const testCategories = [
  {
    name: "UTBK",
    description: "TPS, literasi, penalaran, dan latihan lintas subtest untuk jalur SNBT.",
    meta: "PTN Nasional",
    icon: GraduationCapIcon,
  },
  {
    name: "UTUL UGM",
    description: "Paket soal dan simulasi untuk mengukur kesiapan masuk Universitas Gadjah Mada.",
    meta: "Mandiri UGM",
    icon: MedalIcon,
  },
  {
    name: "SIMAK UI",
    description: "Latihan bertahap untuk pola soal seleksi mandiri Universitas Indonesia.",
    meta: "Mandiri UI",
    icon: BrainCircuitIcon,
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

export const pricingBullets = {
  free: ["5 latihan per bulan", "2 quiz per bulan", "1 tryout gratis per bulan"],
  pro: ["50 latihan per bulan", "20 quiz per bulan", "5 tryout per bulan", "Ranking dan pembahasan penuh"],
  max: ["Latihan tanpa batas", "Quiz tanpa batas", "Tryout tanpa batas", "Akses paling lengkap"],
} as const;

export const trustBadges = [
  { label: "Autosave Jawaban", icon: CheckCircle2Icon },
  { label: "Pembahasan Bertahap", icon: SparklesIcon },
  { label: "Progress Tracking", icon: BarChart3Icon },
];

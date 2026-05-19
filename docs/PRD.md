# PRD Nalarin.id

## 1. Ringkasan Produk

**Nalarin.id** adalah platform persiapan tes online untuk **UTBK**, **UTUL UGM**, **SIMAK UI**, dan **CPNS**. Produk menyediakan bank soal, latihan dengan **Mode Latihan** dan **Mode Quiz**, tryout rutin, review jawaban, pembahasan, progress tracking, blog edukasi, serta subscription Free, Pro, dan Max.

Produk mengambil inspirasi dari pola fitur aimasukptn: landing page, bank soal, mode latihan/quiz, tryout events, review pembahasan, progress tracking, dan premium access. Namun Nalarin.id dibuat lebih sederhana dan fokus pada MVP yang bisa dibangun cepat.

---

## 2. Tujuan Produk

- Membantu user mempersiapkan UTBK, UTUL UGM, SIMAK UI, dan CPNS melalui latihan soal dan tryout rutin.
- Menyediakan dua mode belajar: **Mode Latihan** untuk belajar santai dan **Mode Quiz** untuk simulasi singkat.
- Menyediakan tryout multi-section/subtest dengan durasi berbeda per section.
- Menyediakan review jawaban, pembahasan, dan progress tracking.
- Menyediakan ranking tryout yang akurat dan dinamis melalui query.
- Menyediakan monetisasi sederhana melalui plan Free, Pro, dan Max.
- Memudahkan admin mengelola user, subscriber/payment, soal, practice, tryout, dan blog.

---

## 3. Scope MVP

### 3.1 In Scope

- Auth: register, login Google, verifikasi email, logout.
- Landing page publik.
- Bank soal / latihan dengan Mode Latihan dan Mode Quiz.
- Tryout rutin multi-section/subtest.
- Auto save jawaban.
- Auto submit saat waktu habis.
- Acak soal dan acak opsi (khusus tryout).
- Pengaturan hasil langsung setelah submit (khusus tryout).
- Review jawaban dan pembahasan untuk latihan, quiz, dan tryout.
- Ranking tryout berbasis query dinamis.
- Progress / tracking belajar.
- Blog.
- Account profile.
- Payment Midtrans.
- Admin panel.
- Import soal via Excel.
- Generate soal dengan AI dari halaman create question (modal parameter + autofill form).
- Generate explanation dengan AI dari field explanation di halaman create/edit question (autofill langsung, tanpa modal, syarat semua field wajib terisi).

### 3.2 Out of Scope

- Mobile app native.
- Live class.
- Forum komunitas.
- Chat tutor manusia.
- Re-attempt / ujian ulang pada tryout yang sama.
- Subscription recurring otomatis.
- Renewal sebelum subscription aktif berakhir.
- Multi-role admin granular.
- CRUD plan di database.
- Activity logs kompleks.
- Anti-cheating kompleks seperti face detection atau tab monitoring.

---

## 4. Role dan Hak Akses

### 4.1 Role

Role hanya terdiri dari:

- `user`
- `admin`

### 4.2 User

User dapat:

- Register dan login menggunakan Google.
- Melakukan verifikasi email.
- Mengakses landing page dan blog.
- Mengakses latihan sesuai plan.
- Memulai Mode Latihan atau Mode Quiz.
- Mengikuti tryout sesuai akses plan.
- Melihat hasil, review jawaban, dan pembahasan manual sesuai setting dan plan.
- Mendapatkan Pembahasan AI per soal di halaman review (khusus plan Pro dan Max).
- Melihat ranking tryout jika plan mengizinkan.
- Melihat progress belajar.
- Mengubah profil.
- Membeli plan Pro atau Max jika tidak sedang memiliki subscription aktif.

### 4.3 Admin

Admin dapat:

- Melihat dan mencari daftar user, melihat detail user, mengubah role dan status user, serta menghapus user. Admin tidak dapat membuat user baru dari panel admin.
- Manage subscribers dan payment.
- Approve payment manual.
- Cancel subscription.
- Force downgrade user ke Free.
- Menambahkan subscription manual (hanya untuk plan Pro atau Max).
- Mengedit nama dan deskripsi exam type yang sudah ada (tidak dapat menambah atau menghapus exam type pada MVP).
- Manage subjects/subtest.
- Manage topics.
- Manage questions.
- Import questions via Excel.
- Generate questions dengan AI dari halaman create question.
- Generate explanation dengan AI dari field explanation di halaman create/edit question (syarat semua field wajib terisi).
- Manage practices.
- Manage tryouts.
- Melihat hasil tryout user.
- Manage blog.

---

## 5. Plan dan Monetisasi

### 5.1 Jenis Plan

| Plan | Harga | Durasi | Deskripsi |
|---|---:|---|---|
| Free | Rp0 | Permanen | Akses dasar dan konten gratis terbatas |
| Pro | Rp50.000/bulan | 1 bulan | Akses lebih luas untuk latihan dan tryout |
| Max | Rp100.000/bulan | 1 bulan | Akses paling lengkap untuk user intensif |

### 5.2 Ketentuan Plan

- Plan disimpan sebagai **TypeScript/JavaScript config object**, bukan tabel database.
- Admin tidak memiliki CRUD plan.
- Config plan memuat kode plan, nama plan, harga, diskon persen, durasi, limit fitur, dan akses fitur.
- Status plan aktif user diambil dari tabel `subscriptions`, bukan dari field cache di `users`.
- Jika tidak ada subscription berbayar aktif, user dianggap menggunakan plan Free.
- User hanya dapat membeli plan baru jika tidak memiliki subscription berbayar aktif.
- Tidak ada fitur renewal sebelum masa aktif berakhir.
- Jika subscription Pro/Max expired atau dibatalkan, akses user kembali ke Free.
- Pembayaran dapat dilakukan melalui **Midtrans** (otomatis via webhook) atau melalui **transfer manual** yang diverifikasi dan diapprove oleh admin.
- Harga checkout dihitung dari harga plan dan diskon persen di config.

### 5.3 Contoh Plan Config

Bagian ini adalah contoh struktur config, bukan tabel database.

```ts
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    discountPercent: 0,
    durationDays: null,
    limits: {
      practiceSessionsPerMonth: 5,
      quizSessionsPerMonth: 2,
      tryoutSessionsPerMonth: 1,
    },
    access: {
      freePractices: true,
      paidPractices: false,
      freeTryouts: true,
      paidTryouts: false,
      ranking: false,
      manualExplanation: false,
      aiExplanation: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 50000,
    discountPercent: 0,
    durationDays: 30,
    limits: {
      practiceSessionsPerMonth: 50,
      quizSessionsPerMonth: 20,
      tryoutSessionsPerMonth: 5,
    },
    access: {
      freePractices: true,
      paidPractices: true,
      freeTryouts: true,
      paidTryouts: true,
      ranking: true,
      manualExplanation: true,
      aiExplanation: true,
    },
  },
  max: {
    name: 'Max',
    price: 100000,
    discountPercent: 0,
    durationDays: 30,
    limits: {
      practiceSessionsPerMonth: null,
      quizSessionsPerMonth: null,
      tryoutSessionsPerMonth: null,
    },
    access: {
      freePractices: true,
      paidPractices: true,
      freeTryouts: true,
      paidTryouts: true,
      ranking: true,
      manualExplanation: true,
      aiExplanation: true,
    },
  },
}
```

### 5.4 Active Plan Source of Truth

- Source of truth plan aktif adalah tabel `subscriptions`.
- `users` tidak menyimpan `current_plan_code` dan `plan_expires_at`.
- Helper aplikasi membaca subscription aktif user untuk menentukan plan.
- Jika tidak ada subscription aktif, helper mengembalikan Free.
- Hanya boleh ada satu subscription berstatus `active` per user di service layer.
- Proses expired/downgrade wajib idempotent agar aman ketika cron dan lazy check berjalan bersamaan.

### 5.5 Payment dan Subscription

- User memilih Pro atau Max.
- Sistem membuat payment record dengan status `pending` dan `subscription_id = null`.
- Sistem membuat transaksi Midtrans dan menyimpan `gateway_order_id` dan `payment_url`.
- Jika pembayaran sukses (webhook Midtrans diterima), sistem membuat subscription baru dengan status `active`, lalu mengisi `payments.subscription_id` dengan ID subscription baru tersebut.
- Untuk pembayaran manual yang di-approve admin, admin membuat subscription aktif secara manual dan mengisi `payments.subscription_id`.
- Setelah subscription aktif selama 1 bulan (atau sesuai durasi plan), status menjadi `expired`.
- Selama subscription aktif, user tidak dapat membeli plan baru.
- Sistem mencegah user memiliki lebih dari satu payment berstatus `pending` pada satu waktu, tanpa memandang gateway (Midtrans maupun manual). Jika payment pending sudah ada, sistem menampilkan link atau instruksi pembayaran yang sama.
- User boleh membatalkan payment pending dari UI untuk mengganti plan sebelum membayar.
- Jika admin cancel subscription aktif, subscription langsung menjadi `cancelled` dan user kembali ke Free.
- Payment sukses dari Midtrans wajib diproses secara idempotent berdasarkan gateway order/transaction id.

### 5.6 Hierarki Akses Plan dan Setting Konten

Akses user terhadap fitur adalah gabungan dari **akses plan** dan **setting konten**.

Contoh:

- Jika tryout menampilkan ranking tetapi plan user tidak mengizinkan ranking, user tidak dapat melihat ranking.
- Jika plan user mengizinkan pembahasan manual (`manualExplanation`) tetapi practice/tryout belum merilis pembahasan, pembahasan tetap tidak tampil.
- Pembahasan AI (`aiExplanation`) tersedia per-soal on-demand di halaman review — hanya dikendalikan oleh plan user, tidak bergantung pada `show_explanation_after_submit`, jadwal rilis konten, maupun apakah pembahasan manual tersedia. User Pro/Max dapat meminta Pembahasan AI bahkan jika admin belum mengisi pembahasan manual.
- Dengan kata lain, akses pembahasan manual membutuhkan dua kondisi: setting konten mengizinkan **dan** plan user mengizinkan. Akses Pembahasan AI hanya membutuhkan satu kondisi: plan user mengizinkan (`aiExplanation = true`).

### 5.7 Jadwal Rilis Hasil, Ranking, dan Pembahasan Tryout

Field `result_release_at`, `ranking_release_at`, dan `explanation_release_at` pada `tryouts` berfungsi sebagai jadwal tunda rilis konten setelah tryout selesai.

Aturan interaksi dengan toggle `show_*_after_submit`:

- Jika toggle `show_result_after_submit = false`, hasil tidak pernah ditampilkan tanpa memandang jadwal rilis.
- Jika toggle `show_result_after_submit = true` dan `result_release_at` belum tiba, hasil belum tersedia meskipun session sudah graded.
- Jika toggle `show_result_after_submit = true` dan `result_release_at` sudah lewat (atau null), hasil langsung tersedia setelah session graded.
- Aturan yang sama berlaku untuk `show_ranking_after_submit` + `ranking_release_at` dan `show_explanation_after_submit` + `explanation_release_at`.

Pengecekan jadwal rilis dilakukan secara **lazy** saat user mengakses halaman hasil/ranking/pembahasan. Tidak membutuhkan cron khusus untuk rilis konten.

---

## 6. Tech Stack

### 6.1 Core Framework

- **Next.js 16** (latest stable: 16.2.x) — fullstack React framework dengan App Router, React Server Components, Server Actions, dan Route Handlers. Turbopack aktif secara default sebagai bundler. `proxy.ts` digunakan sebagai pengganti `middleware.ts` untuk network boundary.
- **React 19** — versi React terbaru, sudah terbundel dengan Next.js 16.
- **TypeScript 5** — wajib di seluruh codebase. Gunakan `next.config.ts` untuk konfigurasi.

### 6.2 UI dan Styling

- **shadcn/ui** — library komponen utama. Bukan package npm; komponen di-copy ke `components/ui/` dan sepenuhnya dimiliki codebase (copy-paste architecture). Dibangun di atas Radix UI untuk aksesibilitas dan Tailwind CSS untuk styling. Komponen yang digunakan: Button, Input, Form, Dialog, Sheet, Table, Tabs, Select, Dropdown, Badge, Card, Tooltip, Skeleton, dan lainnya sesuai kebutuhan.
- **Radix UI** — headless primitives yang sudah terintegrasi via shadcn/ui. Digunakan langsung jika shadcn/ui belum menyediakan komponen tertentu.
- **Tailwind CSS v4** — utility-first CSS framework. Digunakan bersama shadcn/ui untuk kustomisasi tema dan komponen custom.
- **Lucide React** — icon library yang menjadi standar ekosistem shadcn/ui. Ringan, tree-shakeable, dan konsisten.
- **Sonner** — toast/notification library yang direkomendasikan shadcn/ui. Ringan dan mudah diintegrasikan dengan Server Actions.
- **Framer Motion** — animasi UI untuk transisi halaman dan micro-interaction. Opsional, digunakan secara selektif.

### 6.3 Data, ORM, dan Validasi

- **Drizzle ORM** — ORM utama. Type-safe, ringan, dan memiliki ekosistem migrasi (`drizzle-kit`) yang baik. Schema database didefinisikan sepenuhnya di Drizzle dengan TypeScript.
- **MySQL2** — driver MySQL untuk Node.js, digunakan bersama Drizzle ORM.
- **MySQL** — database utama.
- **Zod** — schema validation untuk form, API input, dan environment variables. Diintegrasikan dengan React Hook Form via `@hookform/resolvers/zod`.

### 6.4 Form Handling

- **React Hook Form** (`react-hook-form`) — form state management yang performant. Tidak ada re-render unnecessary.
- **`@hookform/resolvers`** — bridge antara React Hook Form dan Zod untuk validasi form yang type-safe.

### 6.5 Autentikasi dan Session

- **iron-session** — server-side session management berbasis encrypted HTTP-only cookie. Digunakan untuk menyimpan session token di cookie; data session aktual tetap disimpan di tabel `user_sessions` di database sesuai desain PRD. Cocok karena ringan, tidak membutuhkan adapter, dan bekerja native dengan Next.js App Router (Server Components, Route Handlers, Server Actions).
- **Google OAuth** — diimplementasikan manual via Google OAuth 2.0 REST API. Tidak menggunakan NextAuth/Auth.js penuh karena logika linking di PRD ini sangat spesifik (wajib email sama, no auto-takeover). Provider saat ini hanya Google; provider lain (Facebook, Apple, dll.) dapat ditambahkan di masa depan cukup dengan menambah kolom `facebook_id`, `apple_id`, dsb. di tabel `users`.

### 6.6 Rich Text Editor

- **Tiptap** — rich text editor untuk konten soal, pembahasan, dan blog. Gunakan package `@tiptap/react`, `@tiptap/starter-kit`, dan ekstensi tambahan sesuai kebutuhan (misalnya `@tiptap/extension-image`, `@tiptap/extension-table`).

### 6.7 Utilitas

- **date-fns** — manipulasi dan formatting tanggal. Ringan dan tree-shakeable.
- **xlsx** (`SheetJS`) — parsing file Excel untuk fitur import soal.
- **midtrans-node** — official Midtrans SDK untuk Node.js, digunakan di Route Handlers untuk membuat transaksi dan memverifikasi webhook signature.
- **Resend** (atau **Nodemailer**) — pengiriman email transaksional (verifikasi email). Resend direkomendasikan karena DX yang lebih baik dan terintegrasi dengan React Email.
- **React Email** — template email berbasis React, dikombinasikan dengan Resend.

### 6.8 Catatan Migrasi dari Nuxt

| Nuxt / Vue | Next.js 16 Equivalent |
|---|---|
| `nuxt/` fullstack server | Next.js App Router + Route Handlers + Server Actions |
| `@nuxt/ui` | shadcn/ui |
| Reka UI | Radix UI (sudah terintegrasi dalam shadcn/ui) |
| `@tiptap/vue-3` | `@tiptap/react` |
| Server routes (Nuxt) | Route Handlers (`app/api/`) + Server Actions |
| Nuxt composables (`useRuntimeConfig`, dll.) | Next.js hooks + env variables |
| Nuxt middleware | `proxy.ts` (Next.js 16) |

---

## 7. Fitur User

### 7.1 Auth

#### Deskripsi

Sistem hanya menggunakan Google OAuth sebagai satu-satunya metode autentikasi. Tidak ada register email/password, lupa password, reset password, atau ubah password. User login dan register sepenuhnya melalui akun Google.

#### Session Management

- Auth menggunakan server-side session cookie (tidak menggunakan JWT stateless).
- Session disimpan di tabel `user_sessions` (lihat Section 10.2).
- Session aktif selama **7 hari sejak login (fixed window)**. `expires_at` ditetapkan saat session dibuat dan **tidak diperpanjang** berdasarkan aktivitas. `last_active_at` diperbarui setiap request untuk keperluan monitoring saja, bukan untuk memperpanjang session.
- Setiap login baru membuat session baru. Multi-device diizinkan.
- Logout menginvalidasi session aktif di sisi server dengan mengisi `user_sessions.revoked_at`. Session valid hanya jika `revoked_at IS NULL` AND `expires_at > NOW()`.
- Tidak ada fitur "logout semua perangkat" pada MVP.

#### Acceptance Criteria

- Email user harus unik.
- Login Google membuat akun baru jika email belum ada di sistem. Email dari Google dianggap terverifikasi; `email_verified_at` diisi otomatis saat akun dibuat.
- Jika email Google sudah terdaftar dan `google_id` sudah terhubung, login Google diizinkan.
- Jika email Google sudah terdaftar tetapi `google_id` masih null, login Google ditolak. Kondisi ini hanya dapat terjadi jika ada akun lama yang dimigrasikan secara manual; aturan ini berfungsi sebagai safeguard.
- User yang belum memiliki `email_verified_at` (akun migrasi lama) dibatasi aksesnya ke latihan, quiz, tryout, dan payment.

### 7.2 Landing Page

#### Konten Utama

- Hero section.
- Kategori tes: UTBK, UTUL UGM, SIMAK UI, CPNS.
- Highlight fitur: bank soal, mode latihan, mode quiz, tryout rutin, ranking, review pembahasan, progress tracking.
- Cara kerja.
- Plan harga.
- FAQ.
- CTA daftar atau mulai gratis.
- Footer lengkap.

### 7.3 Bank Soal / Latihan

#### Deskripsi

Bank soal menampilkan daftar practice yang dibuat admin. User dapat memilih practice berdasarkan exam type, subject, dan topic. Field `topic_id` pada `practices` bersifat metadata untuk keperluan filtering dan tampilan di bank soal — bukan constraint bahwa semua soal dalam practice harus berasal dari topic tersebut.

#### Flow User

1. User memilih exam type.
2. User memilih subject/subtest.
3. User memfilter daftar practice berdasarkan topic jika diperlukan.
4. User memilih satu practice.
5. User memilih Mode Latihan atau Mode Quiz.
6. Sistem mengecek email verified, akses plan, dan limit bulanan.
7. Sistem membuat `practice_session` (dengan status awal `in_progress`) dan snapshot soal.
8. User mengerjakan soal.
9. Sistem autosave jawaban dan posisi soal terakhir (`current_question_order`).
10. User submit atau waktu habis jika mode quiz.
11. Sistem menghitung skor, menampilkan hasil, review, dan pembahasan sesuai setting dan plan.
12. Progress diperbarui setelah session berstatus `graded`.

#### Mode Latihan

- Tanpa timer.
- Navigasi berurutan — user tidak dapat melompat ke soal lain secara bebas.
- User **wajib menjawab** soal sebelum dapat melanjutkan. Tombol "Lanjut" baru aktif setelah user memilih atau mengisi jawaban.
- Setelah user mengklik **"Konfirmasi"**, jawaban dikunci dan sistem langsung menampilkan status benar/salah serta pembahasan soal tersebut secara seketika.
- User tidak dapat mengubah jawaban setelah konfirmasi.
- Tidak ada halaman submit akhir — session selesai otomatis setelah soal terakhir dikonfirmasi.

#### Mode Quiz

- Menggunakan timer; durasi ditentukan oleh admin saat membuat practice.
- Navigasi bebas — user dapat berpindah ke soal mana pun.
- User boleh mengosongkan jawaban (melewati soal).
- Jawaban dan pembahasan ditampilkan setelah submit, bukan seketika.
- Jika waktu habis, session auto submit dengan jawaban terakhir yang tersimpan.
- Timer dihitung dari server time.

#### Resume Session

- Jika user memiliki practice session `in_progress`, sistem menampilkan opsi **Lanjutkan** atau **Mulai Baru**.
- Jika user memilih **Lanjutkan**, sistem memuat session lama dan mengarahkan user ke soal terakhir berdasarkan `current_question_order`.
- Jika user memilih **Mulai Baru**, session lama diubah menjadi `cancelled` dan **tetap dihitung dalam monthly usage**. Session baru dibuat dan counter monthly usage diincrement kembali. Desain ini disengaja untuk mencegah abuse pola resume-cancel-resume; user disarankan memastikan kesiapan sebelum memulai session.
- Sebelum user memilih **Mulai Baru**, sistem wajib menampilkan konfirmasi bahwa session lama akan dibatalkan dan tetap dihitung dalam limit bulanan.

#### Background Job untuk Practice Session

Background job membedakan dua kondisi:

1. **Mode Quiz — timer sudah habis:** Jika `started_at + duration_minutes` sudah terlampaui dan session masih `in_progress`, background job melakukan **auto submit** dengan jawaban terakhir yang tersimpan dan menjalankan scoring. Session tidak di-cancel karena user berhak mendapatkan hasil.

2. **Session terbengkalai — tidak ada aktivitas:** Jika session `in_progress` tidak memiliki aktivitas autosave selama lebih dari threshold yang ditentukan (misal 24 jam), background job menandai session sebagai `cancelled`. Berlaku untuk Mode Latihan maupun Mode Quiz yang belum timer habis.

### 7.4 Navigasi Soal

#### Mode Navigasi

Navigasi soal sudah ditentukan per mode dan tidak dapat dikonfigurasi admin secara terpisah:

- **Mode Latihan:** selalu berurutan. User tidak dapat melompat ke soal lain.
- **Mode Quiz dan Tryout:** selalu bebas. User dapat berpindah ke nomor soal mana pun dalam session/section aktif.

#### Status Soal

- Belum dijawab.
- Dijawab.
- Ditandai ragu-ragu (khusus Mode Quiz dan Tryout).
- Dijawab dan ditandai ragu-ragu (khusus Mode Quiz dan Tryout).
- Terkunci setelah konfirmasi (Mode Latihan), atau setelah submit/waktu habis (Mode Quiz dan Tryout).
- Aktif.

#### Acceptance Criteria

- Mode Latihan: user wajib menjawab sebelum mengklik konfirmasi. Jawaban terkunci setelah konfirmasi.
- Mode Quiz dan Tryout: user boleh mengosongkan jawaban. Soal kosong dihitung sebagai unanswered dengan skor 0.
- Mode Quiz: jika review sebelum submit aktif, sistem menampilkan ringkasan dijawab, belum dijawab, dan ragu-ragu. Sistem dapat menampilkan warning jika masih ada soal kosong, tetapi tidak memblokir submit.

### 7.5 Tryout Rutin

#### Deskripsi

Tryout adalah event ujian rutin yang disusun admin dan terdiri dari beberapa section/subtest. Setiap section memiliki durasi berbeda.

#### Flow User

1. User membuka daftar tryout.
2. User melihat tryout aktif, akan datang, dan selesai.
3. User memilih tryout aktif.
4. Sistem mengecek email verified, akses plan, limit bulanan, dan memastikan user belum memiliki session untuk tryout tersebut.
5. Sistem membuat `tryout_session` (dengan status awal `in_progress`), `tryout_section_sessions` (semua dengan status `pending`), dan snapshot soal.
6. User mengerjakan section pertama.
7. User submit section atau sistem auto submit saat waktu section habis.
8. User lanjut ke section berikutnya.
9. Setelah semua section selesai, tryout session masuk status `submitted`.
10. Sistem menilai semua jawaban secara otomatis.
11. Status session berubah menjadi `graded`.
12. Hasil, review, pembahasan, ranking, dan progress tersedia sesuai setting dan plan.

#### Acceptance Criteria

- Setiap user hanya boleh memiliki satu `tryout_session` per tryout.
- Tidak ada re-attempt.
- Tryout memiliki beberapa section.
- Setiap section memiliki durasi sendiri.
- Auto save jawaban dan posisi soal aktif (`current_question_order` di `tryout_section_sessions`).
- Auto submit saat waktu section habis.
- Auto submit saat periode tryout berakhir jika `enforce_end_time` aktif. `enforce_end_time = true` hanya berlaku jika `ends_at` tidak null.
- Timer dihitung dari server time, bukan hanya dari nilai remaining terakhir di client.
- User tidak dapat kembali mengubah jawaban pada section yang sudah selesai.

### 7.6 Review Jawaban dan Pembahasan

#### Akses dan Ketersediaan

- Halaman review dapat diakses setelah session berstatus `submitted` atau `graded`.
- Akses review (status jawaban benar/salah/kosong) dikendalikan oleh `show_result_after_submit`. Jika `false`, halaman review tidak dapat diakses.
- Akses **pembahasan manual** di dalam halaman review dikendalikan oleh `show_explanation_after_submit`. Jika `false`, kolom pembahasan manual disembunyikan.
- Jika `result_release_at` diisi dan belum tiba, review belum dapat diakses meskipun session sudah submitted/graded.
- Jika `explanation_release_at` diisi dan belum tiba, pembahasan manual disembunyikan meskipun review sudah dapat diakses.
- Akses pembahasan manual juga mengikuti plan user (`manualExplanation`). Jika plan tidak mengizinkan, kolom pembahasan manual disembunyikan meskipun setting konten mengizinkan.
- **Pembahasan AI tersedia secara terpisah**, tidak bergantung pada `show_explanation_after_submit` maupun jadwal rilis. Akses hanya dikendalikan oleh plan user (`aiExplanation = true` untuk Pro dan Max). Lihat subseksi "Fitur Pembahasan AI" di bawah.
- Untuk practice session, tidak ada jadwal rilis. Akses pembahasan manual hanya dikendalikan oleh toggle `show_explanation_after_submit` pada practice dan plan user.

#### Konten Halaman Review

**Header:**
- Judul tryout atau practice.
- Status session: `graded` menampilkan "Skor final".
- Total skor dan skor maksimal.
- Ringkasan: total benar, total salah, total kosong, total soal.
- Jika tryout memiliki `wrong_answer_penalty ≠ 0`, tampilkan keterangan penalti yang berlaku.

**Filter soal:**
- Semua soal.
- Hanya yang benar.
- Hanya yang salah.
- Hanya yang belum dijawab.

**Per soal:**
- Nomor urut dan konten soal (dari snapshot).
- Jawaban user.
- Jawaban benar (kunci jawaban).
- Status: benar, salah, atau kosong.
- Poin yang didapat dan poin maksimal soal tersebut.
- Jika jawaban salah dan tryout memiliki penalti, tampilkan pengurangan poin (contoh: "−0.25 poin").
- Pembahasan manual — jika tersedia sesuai setting dan plan. Pembahasan tidak di-snapshot; jika admin memperbarui pembahasan setelah session berjalan, review menampilkan pembahasan terbaru.
- Tombol **"Pembahasan AI"** — ditampilkan di setiap soal jika plan user mengizinkan (`aiExplanation = true`). Jika plan tidak mengizinkan, tombol tidak ditampilkan atau ditampilkan dengan state terkunci beserta CTA upgrade.

**Breakdown per section (khusus tryout):**
- Nama section.
- Skor section, total benar, total salah, total kosong.
- Durasi pengerjaan section tersebut.

#### Fitur Pembahasan AI

Tersedia di halaman review untuk **semua tipe sesi** (Mode Latihan, Mode Quiz, Tryout). Khusus untuk plan **Pro dan Max**.

**Flow:**
1. User mengklik tombol **"Pembahasan AI"** pada soal tertentu di halaman review.
2. Tombol menampilkan indikator loading. Konten soal tersebut tidak di-block — soal lain tetap dapat dilihat.
3. Sistem mengirim request ke AI provider melalui Route Handler, menyertakan konteks soal dari snapshot session.
4. Hasil pembahasan AI ditampilkan langsung di bawah soal, di bawah pembahasan manual (jika ada).
5. Hasil tidak disimpan ke database — setiap klik tombol selalu memanggil AI baru.
6. Jika AI gagal merespons, tampilkan pesan error ringkas dan beri opsi coba lagi.

**Ketersediaan:**
- Mode Latihan: tombol **"Pembahasan AI"** muncul setelah user mengklik "Konfirmasi" pada soal tersebut, bersama dengan pembahasan manual. Tidak perlu menunggu session selesai.
- Mode Quiz dan Tryout: tombol muncul di halaman review setelah session di-submit/graded.

**Konteks yang dikirim ke AI:**
Semua data diambil dari snapshot session, bukan langsung dari tabel `questions`, agar konsisten dengan kondisi soal saat user mengerjakannya.
- Konten soal (dari `question_snapshot`)
- Tipe soal
- Opsi jawaban (dari `option_snapshot`)
- Kunci jawaban (dari `correct_answer_snapshot`)
- Jawaban user
- Status jawaban user (benar/salah/kosong)
- Exam type, subject, topic
- Pembahasan manual yang ada (dari `questions.manual_explanation`, nullable — jika ada, AI dapat memperluas atau melengkapinya)

#### Prompt Template Pembahasan AI (User-Facing)

Prompt berikut digunakan sistem saat user mengklik "Pembahasan AI" di halaman review. Semua parameter diisi dari data session dan soal.

```
Kamu adalah tutor ahli untuk persiapan ujian {exam_type} — {subject}.

Buat pembahasan yang jelas, terstruktur, rinci, dan mudah dipahami untuk soal berikut.

---
INFORMASI SOAL
Tipe soal: {question_type}
Materi/Topik: {topic}
Soal: {question_content}
{options_block}
Kunci jawaban: {correct_answer}
Jawaban user: {user_answer}
Status jawaban user: {answer_status}
{manual_explanation_block}
---

INSTRUKSI PEMBAHASAN:

Tulis pembahasan dengan urutan berikut — gunakan heading yang jelas untuk setiap bagian:

1. **Jawaban yang Benar**
   Sebutkan kunci jawaban dan jelaskan secara singkat mengapa jawaban tersebut benar. Mulai dari konsep atau prinsip yang mendasari, bukan sekadar menyatakan "jawaban yang benar adalah...".

2. **Penjelasan Konsep**
   Jelaskan konsep, teori, atau materi inti yang diuji soal ini secara mendalam. Gunakan bahasa yang mudah dipahami. Sertakan contoh konkret jika membantu pemahaman.

3. **Analisis Pilihan Jawaban** *(hanya untuk multiple_choice dan multiple_answer)*
   Jelaskan satu per satu mengapa setiap pilihan benar atau salah. Jangan hanya menyebut "pilihan ini salah" — jelaskan alasan substantifnya agar user memahami perbedaannya.

4. **Analisis Jawaban User** *(hanya jika user menjawab salah atau kosong)*
   Jelaskan dengan empati mengapa jawaban user kurang tepat. Identifikasi kemungkinan miskonsepsi atau jebakan yang membuat user memilih jawaban tersebut, lalu luruskan.

5. **Tips dan Trik**
   Berikan 1–2 strategi atau cara cepat untuk menyelesaikan soal serupa di ujian nyata. Fokus pada pendekatan yang praktis dan hemat waktu.

6. **Rangkuman**
   Tutup dengan 2–3 kalimat poin kunci yang harus diingat user dari soal ini.

ATURAN PENULISAN:
- Gunakan Bahasa Indonesia yang baik, jelas, dan tidak kaku.
- Hindari kalimat pembuka seperti "Baik, saya akan menjelaskan..." atau "Tentu saja...".
- Langsung masuk ke konten pada setiap bagian.
- Jika {answer_status} adalah "benar", lewati bagian "Analisis Jawaban User" dan beri apresiasi singkat di bagian Rangkuman.
- Jika soal bertipe true_false atau short_answer, sesuaikan bagian yang relevan dan lewati bagian "Analisis Pilihan Jawaban".
- Format menggunakan Markdown: heading bold, bullet list untuk poin, dan teks biasa untuk penjelasan panjang.
```

**Keterangan blok parameter:**
- `{options_block}`: diisi daftar opsi (A, B, C, dst.) jika tipe soal `multiple_choice`, `multiple_answer`, atau `true_false`. Dikosongkan untuk `short_answer`.
- `{manual_explanation_block}`: jika `manual_explanation` ada, diisi dengan `Pembahasan dari admin: {manual_explanation}` agar AI dapat memperluas atau melengkapinya. Jika null, blok ini dikosongkan.
- `{answer_status}`: diisi `"benar"`, `"salah"`, atau `"tidak dijawab"`.



### 7.7 Hasil dan Ranking Tryout

#### 7.7.1 Halaman Hasil Tryout

Halaman ini ditampilkan setelah user selesai mengerjakan tryout (session berstatus `submitted` atau `graded`), dan mengikuti aturan rilis dari setting tryout.

**Ketersediaan:**
- Ditampilkan hanya jika `show_result_after_submit = true`.
- Jika `result_release_at` diisi dan belum tiba, halaman menampilkan pesan bahwa hasil belum dirilis beserta estimasi waktu rilis.

**Konten halaman hasil:**
- Judul tryout dan tanggal pengerjaan.
- Skor total dan skor maksimal.
- Persentase skor: `total_score / total_max_score × 100`.
- Ringkasan jawaban: total benar, total salah, total kosong, total soal.
- Breakdown per section: nama section, skor section, benar/salah/kosong, durasi pengerjaan.
- Durasi total pengerjaan aktif.
- Tombol menuju halaman Review Jawaban (jika `show_result_after_submit = true` dan jadwal rilis `result_release_at` sudah lewat atau null).
- Tombol menuju halaman Ranking (jika `show_ranking_after_submit = true` dan jadwal rilis `ranking_release_at` sudah lewat atau null).

#### 7.7.2 Ranking Tryout

**Ketersediaan:**
- Ditampilkan hanya jika `show_ranking_after_submit = true`.
- Jika `ranking_release_at` diisi dan belum tiba, tampilkan pesan bahwa ranking belum dirilis beserta estimasi waktu rilis.
- Free user yang mengikuti tryout tetap berkontribusi dalam perhitungan ranking, tetapi tidak dapat melihat leaderboard jika plan tidak mengizinkan.

**Konten leaderboard:**
- Posisi ranking user sendiri selalu ditampilkan di bagian atas (pinned), terpisah dari tabel leaderboard utama, agar user langsung tahu posisinya tanpa harus scroll.
- Tabel leaderboard: nomor urut, nama user (dengan avatar opsional), skor total, total benar, durasi pengerjaan aktif.
- Total peserta yang sudah graded.

**Urutan ranking:**
- Diurutkan berdasarkan `total_score` tertinggi.
- Tie-breaker berurutan jika skor sama:
  1. `total_sections_started` terbanyak (section yang pernah dibuka user secara aktif).
  2. `total_correct` tertinggi.
  3. `duration_used_seconds` tersingkat.
  4. `submitted_at` paling awal.
- Ranking dihitung secara dinamis dari query, tidak disimpan sebagai field di database.
- Hanya `tryout_sessions` berstatus `graded` yang masuk perhitungan ranking.


### 7.8 Progress / Tracking

#### Mekanisme Update

- Progress diperbarui setelah practice session atau tryout session berstatus `graded`.
- Data progress disimpan sebagai upsert di `user_progress_snapshots` — satu record per kombinasi `user_id + exam_type_id + subject_id`.
- User hanya dapat melihat progress miliknya sendiri.

#### Konten Halaman Progress

**Filter:**
- Satu filter tunggal: **Jenis Ujian** — pilihan: Semua, UTBK, CPNS, UTUL UGM, SIMAK UI.
- Tidak ada filter subtes dan tidak ada filter periode. Statistik selalu bersifat all-time.

**Statistik (3 kartu, all-time sesuai filter jenis ujian aktif):**

Data ini bersumber dari `user_progress_snapshots`. Tidak mendukung filter periode karena tabel ini adalah upsert — satu record per `user_id + exam_type_id + subject_id`, bukan time-series.

- **Soal Dijawab** — total soal yang dijawab (benar + salah, tidak termasuk yang dikosongkan), disertai rincian benar dan salah di bawahnya.
- **Akurasi** — `total_correct / total_questions_answered × 100`.
- **Rata-Rata Skor** — skor ternormalisasi 0–100: `total_score_aggregate / total_max_score_aggregate × 100`. Ternormalisasi agar adil lintas session dengan jumlah soal dan bobot berbeda.

Waktu update terakhir ditampilkan sebagai teks kecil di bawah kartu statistik, bukan sebagai kartu tersendiri.

**Analisis topik (all-time, maksimal 3 topik per kolom):**
- **Topik Terkuat** — 3 topik dengan akurasi tertinggi, disertai nilai akurasi per topik.
- **Topik Prioritas** — 3 topik dengan akurasi terendah, disertai nilai akurasi per topik.
- Data bersumber dari field JSON di `user_progress_snapshots` dan di-snapshot saat progress terakhir diperbarui. Jika admin mengganti nama topik setelah update terakhir, nama yang tampil bisa stale sampai progress user diperbarui kembali.
- Jika user belum memiliki cukup data topik, kolom ini tidak ditampilkan.

**Riwayat Aktivitas:**
- Daftar practice dan tryout yang sudah diselesaikan (status `graded`), diurutkan dari yang terbaru.
- Tidak ada filter periode — user cukup scroll untuk melihat riwayat lebih lama.
- Per item: label tipe (Latihan/Quiz/Tryout), label jenis ujian, judul konten, tanggal pengerjaan, jumlah benar, jumlah salah, skor, dan tombol Review (jika tersedia sesuai setting dan plan).


### 7.9 Blog

- User dapat melihat daftar artikel.
- User dapat membaca detail artikel.
- Artikel dapat memiliki kategori dan tag.
- Blog digunakan untuk edukasi, SEO, pengumuman, dan panduan belajar.

### 7.10 Account Profile

User dapat:

- Melihat profil.
- Mengubah nama.
- Mengubah foto profil opsional.
- Mengubah tanggal lahir.
- Mengubah bio.
- Mengubah gender.
- Mengubah WhatsApp/phone.
- Menghubungkan Google login dari halaman profil.
- Melihat status subscription aktif.
- Melihat riwayat transaksi.

---

## 8. Fitur Admin

### 8.1 Manage Users

Admin dapat:

- Melihat daftar user beserta informasi ringkas (nama, email, role, status, tanggal daftar).
- Mencari user berdasarkan nama atau email.
- Melihat detail user lengkap.
- Mengubah **role** user (`user` ↔ `admin`).
- Mengubah **status** user (`active`, `inactive`, `suspended`).
- Menghapus user — hanya diperbolehkan jika user belum memiliki riwayat data apapun (transaksi, subscription, practice session, maupun tryout session). Jika user sudah memiliki riwayat data, admin tidak dapat menghapus akun dan sebagai gantinya dapat menonaktifkan user melalui perubahan status menjadi `inactive` atau `suspended`.
- Melihat riwayat subscription dan payment milik user.
- Melihat riwayat practice dan tryout milik user.

Admin **tidak dapat** membuat user baru dari panel admin. Pembuatan akun hanya melalui alur register di aplikasi.

### 8.2 Manage Subscribers dan Payment

Admin dapat:

- Melihat daftar payment.
- Melihat detail payment.
- Approve payment manual (lihat Flow 14.7).
- Cancel subscription aktif.
- Force downgrade user ke Free.
- Menambahkan subscription manual hanya untuk `plan_code = pro` atau `max`. Admin tidak dapat membuat subscription manual dengan `plan_code = free` karena status Free sudah otomatis berlaku saat tidak ada subscription berbayar aktif.
- Untuk subscription dengan source `admin_grant`, admin **wajib menentukan `ends_at` secara manual** saat membuat subscription. Tidak ada pengisian durasi otomatis. Admin bebas menentukan rentang tanggal aktif (misalnya 7 hari trial, 30 hari kompensasi, atau durasi lain sesuai kebutuhan).

### 8.3 Manage Question

Admin dapat:

- CRUD soal.
- Memilih exam type, subject, dan topic.
- Memilih tipe soal.
- Mengisi tahun soal jika soal diambil dari tahun tertentu.
- Menambah opsi jawaban.
- Menentukan kunci jawaban.
- Mengatur scoring rule untuk multiple answer.
- Mengisi pembahasan manual atau generate dengan AI dari field explanation (lihat subseksi AI Generate Explanation).
- Generate soal dengan AI langsung dari halaman create question (lihat subseksi AI Generate Soal).
- Import soal via Excel.

#### AI Generate Soal

Fitur ini tersedia di halaman **Create Question** melalui tombol **"AI Generate"**.

**Flow:**
1. Admin membuka halaman Create Question.
2. Admin mengklik tombol **"AI Generate"**.
3. Muncul modal form berisi parameter yang harus diisi sebagai bahan instruksi ke AI.
4. Admin mengisi parameter dan mengklik **"Generate"**.
5. AI memproses permintaan. Selama proses berjalan, tombol Generate menampilkan indikator loading.
6. Setelah AI selesai, modal tertutup otomatis dan semua field di form Create Question ter-autofill dengan hasil generate: konten soal, opsi jawaban, kunci jawaban, dan explanation.
7. Admin memeriksa dan menyesuaikan hasil sebelum menyimpan soal.

**Parameter modal AI Generate:**

| Parameter | Keterangan |
|---|---|
| Bahasa | Pilihan: **Bahasa Indonesia** atau **English** — menentukan bahasa soal yang dihasilkan |
| Tipe soal | Diambil dari pilihan tipe soal yang sudah dipilih admin di form utama (pre-filled, bisa diubah) |
| Tingkat kesulitan | Pilihan: Easy, Medium, Hard |
| Format soal | Pilihan: **Soal Mandiri** (pertanyaan langsung tanpa teks pengantar), **Berbasis Teks Bacaan** (disertai paragraf/wacana), **Berbasis Kasus/Skenario** (disertai narasi situasi), **Berbasis Data/Tabel** (disertai tabel atau data statistik) |
| Jumlah opsi | Hanya muncul jika tipe soal adalah `multiple_choice` atau `multiple_answer`. Pilihan: 2, 3, 4, atau 5 opsi |
| Topik/Materi | Teks bebas — admin mendeskripsikan materi atau topik spesifik yang ingin dibuatkan soalnya |
| Konteks tambahan | Teks bebas opsional — instruksi atau konteks khusus yang ingin disertakan ke AI |

**Catatan:** Field exam type, subject, dan topic yang sudah dipilih di form utama dikirim ke AI secara otomatis sebagai konteks, tanpa perlu diisi ulang di modal.

#### Prompt Template AI Generate Soal

Prompt berikut digunakan sistem untuk menginstruksikan AI membuat soal. Parameter dalam kurung kurawal digantikan dengan nilai dari form sebelum dikirim.

```
You are an expert question writer specializing in high-quality exam preparation content for competitive academic and civil service tests.

Create ONE exam question based on the following parameters:
- Exam Type: {exam_type}
- Subject/Subtest: {subject}
- Topic: {topic}
- Question Type: {question_type}
- Question Format: {question_format}
- Difficulty: {difficulty}
- Language: {language}
- Number of Options: {option_count} (only applicable for multiple_choice and multiple_answer; omit this line for other question types)
- Additional Context: {additional_context}

Question Format guidance:
- standalone: a direct question with no accompanying text or stimulus
- reading_passage: include a paragraph or short text as stimulus before the question; the question must require reading and understanding the passage
- case_scenario: include a realistic situation or narrative as stimulus; the question must require reasoning about the case
- data_table: include a table, chart description, or statistical data as stimulus; the question must require interpreting the data

Difficulty guidance:
- easy: tests direct recall of facts or definitions, or single-step straightforward reasoning
- medium: requires understanding, application of a concept to a new situation, or two-step reasoning
- hard: requires multi-step analysis, synthesis across concepts, or evaluation — not merely obscure memorization

Quality requirements:
- The question must be factually accurate, unambiguous, and clearly relevant to the subject matter
- For multiple_choice: exactly one correct answer; distractors must be plausible, structurally parallel, and not obviously wrong
- For multiple_answer: at least 2 correct options; all options must be structurally parallel and homogeneous in length and form
- For true_false: the statement must be definitively true or false with absolutely no grey area
- For short_answer: include a specific reference answer that will be used for automated case-insensitive matching
- Do not include any clues in the question stem that hint at the correct answer
- Write the explanation as a clear educational justification that teaches the underlying concept, not just restates the answer

Respond ONLY with a valid JSON object in the following format, with no additional text, no markdown, and no code fences:
{
  "question_content": "Full question text here, including any stimulus (passage, scenario, or data table) if applicable",
  "options": [
    { "label": "A", "content": "Option text", "is_correct": false },
    { "label": "B", "content": "Option text", "is_correct": true }
  ],
  "correct_answer_text": "",
  "explanation": "Clear and thorough educational explanation here"
}

Output rules:
- "options": fill only for multiple_choice, multiple_answer, and true_false. For true_false, always produce exactly 2 options with labels "True" and "False"; set is_correct to false on both (is_correct is not used as the source of truth for true_false).
- "correct_answer_text": fill only for true_false ("true" or "false" in lowercase) and short_answer (exact reference answer used for case-insensitive matching). Use empty string for multiple_choice and multiple_answer.
- "explanation": always fill with a thorough explanation regardless of question type.
- Produce valid JSON only. Do not wrap in markdown code blocks.
```

#### AI Generate Explanation

Fitur ini tersedia di halaman **Create Question** dan **Edit Question** pada field explanation melalui tombol **"AI Generate"** di samping field tersebut.

**Flow:**
1. Admin mengisi semua field wajib di form terlebih dahulu: exam type, subject, tipe soal, konten soal, dan kunci jawaban (untuk MC/MA: minimal satu opsi ditandai benar; untuk `true_false` dan `short_answer`: `correct_answer_text` sudah diisi).
2. Jika ada field wajib yang belum terisi, tombol "AI Generate" di field explanation dinonaktifkan (disabled) dan menampilkan tooltip yang menjelaskan field mana saja yang masih kosong.
3. Setelah semua field wajib terisi, tombol menjadi aktif.
4. Admin mengklik tombol **"AI Generate"** di samping field explanation.
5. Tidak ada modal — AI langsung diproses menggunakan data dari form yang sudah terisi.
6. Selama proses berjalan, tombol menampilkan indikator loading dan field explanation dinonaktifkan sementara.
7. Setelah AI selesai, hasil explanation langsung mengisi field explanation. Admin dapat mengedit hasilnya sebelum menyimpan.

**Field wajib yang harus terisi sebelum tombol aktif:**

| Field | Syarat |
|---|---|
| Exam type | Sudah dipilih |
| Subject | Sudah dipilih |
| Tipe soal | Sudah dipilih |
| Konten soal | Tidak kosong |
| Opsi jawaban | Minimal 2 opsi terisi (untuk `multiple_choice`, `multiple_answer`, `true_false`) |
| Kunci jawaban | `correct_answer_text` terisi (untuk `true_false` dan `short_answer`) |

Untuk `short_answer`, `correct_answer_text` wajib terisi sebelum tombol generate explanation aktif, karena kunci jawaban dibutuhkan sebagai konteks untuk AI membuat penjelasan yang tepat.

#### Prompt Template AI Generate Explanation

Prompt berikut digunakan sistem untuk menginstruksikan AI membuat explanation. Semua parameter diambil langsung dari isi form, tanpa input tambahan dari admin.

```
You are an expert educator writing high-quality explanations for exam preparation questions.

Write a clear, thorough, and educational explanation for the following question. The explanation must help students understand the underlying concept, not just confirm the correct answer.

Question details:
- Exam Type: {exam_type}
- Subject/Subtest: {subject}
- Topic: {topic}
- Question Type: {question_type}
- Question Content: {question_content}
- Answer Options: {options_with_correct_flag} (omit this line for short_answer; for true_false, list both options with the correct one marked)
- Correct Answer: {correct_answer} (for short_answer, this is the exact reference answer used for auto-grading)

Explanation requirements:
- Start by briefly explaining why the correct answer is correct, grounded in the relevant concept or principle
- For multiple_choice and multiple_answer: explain why each incorrect option (distractor) is wrong — this is critical for learning
- For true_false: explain the principle or fact that makes the statement definitively true or false
- For short_answer: explain why the reference answer is correct, and clarify common misconceptions if applicable
- Use clear, plain language appropriate for the exam level implied by the exam type
- Do not use phrases like "the answer is" or "the correct option is" as the opening — lead with the concept instead
- The explanation must be self-contained and understandable without any external reference

Respond ONLY with the explanation text. No JSON, no markdown formatting, no headers, no labels. Plain text only.
```

#### Penanganan Soal Berdasarkan Tipe

Setiap tipe soal memiliki aturan penyimpanan data yang berbeda:

| Tipe | `question_options` | `correct_answer_text` | Jawaban User |
|---|---|---|---|
| `multiple_choice` | Wajib ada (min. 2), `is_correct = true` untuk satu opsi | Null | `selected_option_keys` (JSON, satu nilai) |
| `multiple_answer` | Wajib ada (min. 2), `is_correct = true` untuk ≥2 opsi | Null | `selected_option_keys` (JSON, banyak nilai) |
| `true_false` | Wajib ada tepat 2 opsi dengan label `True` dan `False`; `is_correct` pada kedua opsi **selalu diisi `false`** dan **tidak digunakan** sebagai sumber kebenaran | Wajib diisi: `"true"` atau `"false"` — ini sumber kebenaran | `selected_option_keys` (JSON, satu nilai: **`"true"` atau `"false"` — selalu lowercase**) |
| `short_answer` | Tidak ada | **Wajib diisi** — digunakan untuk auto-grading case-insensitive | `answer_text` |

**Catatan khusus `true_false`:** Dua opsi di `question_options` dibuat agar tampilan UI konsisten dengan soal pilihan lainnya. Jawaban user **selalu disimpan dalam lowercase** (`"true"` atau `"false"`) di `selected_option_keys`. Penilaian otomatis dilakukan dengan membandingkan langsung nilai `selected_option_keys` dengan `correct_answer_text` — keduanya sudah lowercase sehingga tidak perlu konversi saat penilaian.

**Catatan khusus `short_answer`:** Jawaban user dicocokkan dengan `correct_answer_text` secara case-insensitive dan dengan trimming whitespace di kedua sisi. Jika cocok, `is_correct = true` dan skor penuh. Jika tidak cocok, `is_correct = false` dan skor 0. Penilaian dilakukan otomatis oleh sistem saat session di-submit tanpa perlu koreksi manual maupun AI.

### 8.4 Import Question via Excel

#### Kolom Wajib

- `exam_type_slug`
- `subject_slug`
- `topic_slug` — opsional
- `question_type` — nilai: `multiple_choice`, `multiple_answer`, `short_answer`, `true_false`
- `difficulty` — nilai: `easy`, `medium`, `hard`
- `question_content`
- `option_a` sampai `option_e` — untuk `multiple_choice` dan `multiple_answer`, minimal `option_a` dan `option_b` wajib diisi; opsi lain diisi sesuai kebutuhan. Untuk `true_false`, hanya `option_a = True` dan `option_b = False` yang wajib; `option_c` sampai `option_e` dikosongkan.
- `correct_answer` — format:
  - `multiple_choice`: satu huruf, contoh `A`
  - `multiple_answer`: huruf dipisah koma, contoh `A,C`
  - `true_false`: nilai `true` atau `false`
  - `short_answer`: teks referensi jawaban, opsional
- `scoring_rule` — **wajib diisi** jika `question_type` adalah `multiple_answer`, nilai: `all_or_nothing` atau `partial`; kosongkan untuk tipe lain
- `explanation` — opsional
- `year` — opsional, format angka tahun, contoh `2023`
- `points` — opsional, default mengikuti nilai `points` di entity soal

#### Behavior Import

- Admin upload file Excel sesuai template.
- Sistem validasi semua row terlebih dahulu.
- Jika ada row error, sistem menampilkan daftar error per baris.
- Admin dapat memilih membatalkan import atau hanya mengimport row valid.
- Sistem tidak publish otomatis soal yang gagal validasi.
- Soal hasil import masuk status `draft` secara default.

### 8.5 Manage Practice

Admin dapat:

- Membuat practice.
- Menentukan exam type, subject, topic (sebagai metadata filtering), dan judul.
- Menentukan apakah practice gratis atau berbayar.
- Menentukan durasi quiz (dalam menit) — digunakan saat user memilih Mode Quiz.
- Menambahkan soal ke practice.

Semua practice otomatis mendukung Mode Latihan dan Mode Quiz tanpa perlu konfigurasi tambahan. Perbedaan perilaku antar mode sudah ditentukan secara sistem (lihat Section 7.3).

### 8.6 Manage Tryout

Admin dapat:

- Membuat tryout.
- Menentukan exam type.
- Menentukan jadwal mulai dan selesai.
- Menentukan gratis atau berbayar.
- Menambahkan section/subtest.
- Menentukan durasi tiap section.
- Menambahkan soal ke section.
- Mengatur acak soal, acak opsi, review jawaban, hasil langsung, pembahasan, ranking, dan enforce end time.
- **Menentukan nilai skor untuk jawaban salah (`wrong_answer_penalty`) di level tryout.** Nilai ini berlaku untuk semua section. Contoh: `0` = tidak ada penalti, `-1` = dikurangi 1 poin, `-0.25` = dikurangi 0.25 poin. Default `0`.
- **Menentukan override `wrong_answer_penalty` per section**, jika section tertentu membutuhkan aturan penalti berbeda dari level tryout.
- Mengubah status tryout: publish, unpublish ke draft, atau archive. Aturan transisi dan edit lengkap ada di Section 9.2a.
- Melihat peserta dan hasil.

> **Catatan:** Pengaturan acak soal (`shuffle_questions`) dan acak opsi (`shuffle_options`) berlaku secara global untuk semua section dalam satu tryout. Acak per-section tidak didukung pada MVP.

> **Penalti Jawaban Salah:** `wrong_answer_penalty` adalah nilai skor yang diberikan untuk setiap jawaban **salah** (bukan unanswered). Unanswered selalu mendapat skor `0` tanpa memandang nilai penalti. Penalti diterapkan pada soal objektif (`multiple_choice`, `true_false`, `multiple_answer` dengan `all_or_nothing`). Untuk `multiple_answer` dengan `partial`, nilai penalti menjadi batas bawah (floor) dari formula partial scoring. `short_answer` dinilai auto dan dikenai penalti jika jawaban salah.

#### Validasi Publish Tryout

Tryout tidak boleh dipublish jika:

- Tidak memiliki section.
- Ada section tanpa soal.
- Ada section tanpa durasi.
- Jadwal mulai dan selesai tidak valid (jika keduanya diisi, `ends_at` harus lebih besar dari `starts_at`).
- `enforce_end_time = true` tetapi `ends_at` null. `enforce_end_time` membutuhkan `ends_at` yang valid agar sistem tahu kapan auto-submit dipicu.
- Exam type section/subject tidak sesuai dengan exam type tryout.

### 8.8 Manage Blog

Admin dapat:

- CRUD blog category.
- CRUD blog post.
- Mengatur SEO title dan meta description.
- Upload thumbnail.
- Menyimpan draft tanpa kategori.
- Publish atau archive artikel.

---

## 9. Enum Sistem

| Enum | Nilai |
|---|---|
| UserRole | user, admin |
| UserStatus | active, inactive, suspended |
| Gender | male, female |
| PlanCode | free, pro, max |
| QuestionType | multiple_choice, multiple_answer, short_answer, true_false |
| QuestionDifficulty | easy, medium, hard |
| ScoringRule | all_or_nothing, partial |
| ContentStatus | draft, published, archived |
| SessionStatus | pending, in_progress, submitted, graded, cancelled |
| PracticeMode | practice, quiz |
| AnswerGradingStatus | not_required, graded |
| **GradingSource** | **auto** |
| PaymentStatus | pending, paid, failed, expired, cancelled, refunded |
| PaymentGateway | midtrans, manual |
| PaymentMethod | bank_transfer, e_wallet, qris, credit_card, convenience_store, manual_transfer, other |
| TransactionSource | midtrans_webhook, user_checkout, admin_manual |
| SubscriptionStatus | active, expired, cancelled |
| SubscriptionSource | midtrans, manual, admin_grant |

### 9.1 UserStatus Semantics

- `active`: user dapat menggunakan platform normal.
- `inactive`: akun dinonaktifkan administratif, tidak dapat login.
- `suspended`: akun dibekukan karena pelanggaran atau risiko keamanan, tidak dapat mengakses fitur sampai admin membuka kembali.

### 9.2 Question Status Lifecycle

- `draft`: soal sedang disusun dan belum bisa dipakai user.
- `published`: soal bisa digunakan di practice dan tryout.
- `archived`: soal tidak muncul untuk konten baru, tetapi histori tetap aman.
- Soal yang sudah pernah dipakai dalam session tidak boleh dihapus. Gunakan `archived`.

### 9.2a Tryout Status Lifecycle

#### Transisi Status

| Dari | Ke | Diizinkan? | Syarat |
|---|---|---|---|
| `draft` | `published` | ✅ | Melewati semua validasi publish (Section 8.6) |
| `published` | `draft` | ✅ | **Hanya jika belum ada session apapun** (`tryout_sessions` untuk tryout ini masih kosong). Jika sudah ada session, operasi ditolak dengan pesan error. |
| `published` | `archived` | ✅ | Kapan saja tanpa syarat tambahan. Session yang sudah ada tetap dapat diakses user untuk review. |
| `archived` | apapun | ❌ | `archived` bersifat final. Tidak dapat kembali ke `draft` maupun `published`. |

`published_at` diisi saat pertama kali status berubah ke `published` dan tidak pernah berubah meskipun tryout di-unpublish ke `draft` kemudian di-publish ulang.

#### Aturan Edit Berdasarkan Kondisi

**Field yang selalu dapat diedit** (tidak mempengaruhi hasil apapun), tanpa memandang status atau keberadaan session:
- Judul (`title`) dan deskripsi (`description`)

**Field yang dapat diedit selama belum ada session apapun** (tabel `tryout_sessions` untuk tryout ini masih kosong):
- Jadwal (`starts_at`, `ends_at`, `enforce_end_time`)
- Gratis/berbayar (`is_free`)
- Setting tampilan hasil: `show_result_after_submit`, `result_release_at`
- Setting tampilan ranking: `show_ranking_after_submit`, `ranking_release_at`
- Setting tampilan pembahasan: `show_explanation_after_submit`, `explanation_release_at`
- Review sebelum submit (`allow_review_before_submit`)

**Field yang dilarang diedit setelah ada session apapun** (menyentuh fairness langsung — berlaku meski session masih `in_progress`):
- Tambah, hapus, atau ubah section
- Tambah, hapus, atau ubah soal dalam section
- `wrong_answer_penalty` di level tryout maupun per section
- `shuffle_questions`, `shuffle_options`

Jika admin mencoba mengedit field yang terkunci, sistem menolak operasi dengan pesan error yang menjelaskan alasan penolakan dan menyarankan untuk membuat tryout baru jika perubahan besar diperlukan.

### 9.3 SessionStatus Semantics

- `pending`: section session sudah dibuat tetapi belum dibuka user. **Hanya digunakan pada `tryout_section_sessions`.**
- `in_progress`: session sedang dikerjakan user.
- `submitted`: session telah disubmit, menunggu scoring.
- `graded`: semua jawaban sudah dinilai, skor final tersedia.
- `cancelled`: session dibatalkan, tidak menghasilkan skor.

**Status awal session:**
- `practice_sessions`: status awal **selalu `in_progress`** saat session dibuat — user telah memulai mengerjakan.
- `tryout_sessions`: status awal **selalu `in_progress`** saat session dibuat — user telah memulai tryout.
- `tryout_section_sessions`: status awal **selalu `pending`** saat dibuat — semua section di-pre-create secara bersamaan; section belum tentu langsung dibuka user. Status berubah menjadi `in_progress` ketika user pertama kali membuka section tersebut.

Status `pending` adalah **eksklusif** untuk `tryout_section_sessions` dan tidak boleh digunakan sebagai status awal untuk `practice_sessions` maupun `tryout_sessions`.

**Transisi status yang valid untuk `tryout_section_sessions`:**

- `pending → in_progress`: user membuka section untuk pertama kali.
- `in_progress → submitted`: user submit atau timer section habis.
- `pending → submitted`: section **tidak pernah dibuka** user, tetapi di-auto-submit karena `enforce_end_time` aktif dan `tryout.ends_at` sudah lewat. Skor section ini adalah 0 (semua jawaban kosong). Ini adalah transisi valid yang melewati `in_progress`.

Saat tryout session dibuat, semua `tryout_section_sessions` dibuat sekaligus dengan status `pending`. Status berubah menjadi `in_progress` ketika user membuka section tersebut. Untuk keperluan `enforce_end_time`, section berstatus `pending` dianggap belum dimulai dan di-submit langsung dengan skor 0.

### 9.4 TransactionSource Semantics

- `midtrans_webhook`: payment diproses otomatis melalui webhook notifikasi dari Midtrans.
- `user_checkout`: record payment dibuat saat user memulai checkout (status awal `pending`). Termasuk payment manual yang diinisiasi user dan kemudian di-approve admin — `transaction_source` tetap `user_checkout` karena yang menginisiasi adalah user, bukan admin.
- `admin_manual`: payment **dibuat langsung oleh admin** tanpa diinisiasi oleh user, misalnya untuk koreksi transaksi atau keperluan operasional internal. Tidak mencakup kasus admin meng-approve payment yang diinisiasi user (kasus itu tetap `user_checkout`).

### 9.5 SubscriptionSource Semantics

- `midtrans`: subscription diaktifkan otomatis setelah pembayaran Midtrans sukses.
- `manual`: subscription diaktifkan admin setelah payment manual diverifikasi dan diapprove.
- `admin_grant`: subscription diberikan admin secara langsung tanpa proses pembayaran (misalnya kompensasi, trial khusus, atau bonus internal).

### 9.6 GradingSource Semantics

- `auto`: semua jawaban dinilai otomatis oleh sistem saat session di-submit (`multiple_choice`, `multiple_answer`, `true_false`, `short_answer`). Diisi oleh scoring engine.

---

## 10. Entity dan Atribut

### 10.1 users

Menyimpan identitas akun, kredensial, role, status, dan profil dasar user/admin.

| Field | Keterangan |
|---|---|
| id | Primary key |
| name | Nama user |
| email | Email unik |
| email_verified_at | Waktu verifikasi email, nullable |
| google_id | ID Google OAuth, nullable. Jika di masa depan ditambahkan provider lain (Facebook, Apple, dll.), tambahkan kolom `facebook_id`, `apple_id`, dsb. di tabel ini. |
| avatar_url | Foto profil, nullable |
| role | enum UserRole |
| status | enum UserStatus |
| gender | enum Gender, nullable |
| birth_date | Tanggal lahir, DATE nullable |
| bio | Bio singkat user, TEXT nullable |
| phone_number | Nomor phone/WhatsApp, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.2 user_sessions

Tabel ini menyimpan server-side session cookie untuk autentikasi. Setiap login baru membuat satu row baru. Multi-device didukung (satu user dapat memiliki banyak session aktif). Logout menginvalidasi row session yang bersangkutan dengan mengisi `revoked_at`.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| session_token_hash | Hash token session (token asli disimpan di cookie) |
| expires_at | Waktu kedaluwarsa session. Ditetapkan sebagai **7 hari sejak session dibuat (fixed window)** dan **tidak diperbarui** berdasarkan aktivitas user. Session valid hanya jika `revoked_at IS NULL` AND `expires_at > NOW()`. |
| last_active_at | Waktu aktivitas terakhir, diperbarui setiap request terautentikasi. Digunakan untuk monitoring dan analitik saja; tidak mempengaruhi `expires_at`. |
| ip_address | IP address saat login, nullable |
| user_agent | User agent browser/device, nullable |
| revoked_at | Waktu session dicabut/logout, nullable. |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.3 email_verification_tokens

Menyimpan token verifikasi email untuk akun baru atau resend verifikasi.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| token_hash | Hash token verifikasi |
| expires_at | Kedaluwarsa token |
| used_at | Waktu token digunakan oleh user secara genuine (klik link verifikasi), nullable |
| **invalidated_at** | **Waktu token diinvalidasi oleh sistem (saat token baru dibuat sebelum token ini digunakan), nullable** |
| created_at | Tanggal dibuat |

Token dianggap valid jika: `used_at IS NULL` AND `invalidated_at IS NULL` AND `expires_at > NOW()`.

### 10.6 exam_types

Menyimpan tipe ujian yang didukung, seperti UTBK, UTUL UGM, SIMAK UI, dan CPNS.

| Field | Keterangan |
|---|---|
| id | Primary key |
| name | Nama tipe exam, misalnya UTBK |
| slug | Slug unik |
| description | Deskripsi |
| logo_url | URL logo exam type, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

Data awal exam type disimpan di database melalui seed: UTBK, UTUL UGM, SIMAK UI, dan CPNS. Admin dapat mengedit nama, deskripsi, dan logo exam type yang sudah ada melalui panel admin, tetapi tidak dapat menambah atau menghapus exam type pada MVP.

### 10.7 subjects

Menyimpan mata uji, subtest, atau subject di bawah exam type.

| Field | Keterangan |
|---|---|
| id | Primary key |
| exam_type_id | FK exam_types |
| name | Nama subject/subtest |
| slug | Slug unik per exam type |
| description | Deskripsi, nullable |
| logo_url | URL logo subject, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.8 topics

Topik tidak mendukung hierarki sub-topik pada MVP. Setiap topik langsung berada di bawah satu subject. Hierarki topik bersarang dapat dipertimbangkan di iterasi berikutnya.

| Field | Keterangan |
|---|---|
| id | Primary key |
| subject_id | FK subjects |
| name | Nama topik |
| slug | Slug unik per subject |
| description | Deskripsi, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.9 questions

Menyimpan master soal beserta tipe, tingkat kesulitan, kunci teks, pembahasan, tahun, dan status.

| Field | Keterangan |
|---|---|
| id | Primary key |
| subject_id | FK subjects |
| topic_id | FK topics, nullable |
| type | enum QuestionType |
| difficulty | enum QuestionDifficulty |
| scoring_rule | enum ScoringRule. **Wajib diisi (NOT NULL) jika `type = multiple_answer`**; null untuk semua tipe lain. |
| title | Judul internal, nullable |
| content | Konten soal |
| image_url | Gambar soal, nullable |
| correct_answer_text | Kunci teks. Untuk `true_false`: wajib diisi `"true"` atau `"false"` — ini sumber kebenaran, bukan `is_correct` di `question_options`. Untuk `short_answer`: referensi jawaban, wajib diisi untuk auto-grading. Null untuk `multiple_choice` dan `multiple_answer`. |
| manual_explanation | Pembahasan manual yang ditulis atau di-generate admin, nullable |
| year | Tahun soal, nullable |
| points | Bobot nilai default |
| status | enum ContentStatus |
| created_by | FK users, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.10 question_options

Digunakan untuk `multiple_choice`, `multiple_answer`, dan `true_false`. Tidak dibuat untuk `short_answer`.

| Field | Keterangan |
|---|---|
| id | Primary key |
| question_id | FK questions |
| label | Label opsi: `A`, `B`, `C`, `D`, `E` untuk pilihan ganda; `True` dan `False` untuk true_false |
| content | Konten opsi |
| image_url | Gambar opsi, nullable |
| is_correct | Boolean. Untuk `multiple_choice`: `true` pada satu opsi yang benar. Untuk `multiple_answer`: `true` pada semua opsi yang benar (minimal 2). Untuk `true_false`: **selalu `false` pada kedua opsi** — `is_correct` tidak digunakan sebagai sumber kebenaran untuk tipe ini; gunakan `questions.correct_answer_text`. |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.11 practices

`practices` adalah master paket latihan yang dibuat admin.

| Field | Keterangan |
|---|---|
| id | Primary key |
| exam_type_id | FK exam_types. **Denormalisasi yang disengaja** untuk efisiensi query filtering daftar practice berdasarkan exam type tanpa join ke `subjects`. Sinkronisasi dengan `subjects.exam_type_id` dijaga di service layer. |
| subject_id | FK subjects, wajib diisi |
| topic_id | FK topics, nullable — bersifat metadata untuk filtering di bank soal, bukan constraint pada soal di dalamnya |
| title | Judul practice |
| slug | Slug unik per exam type (lihat Section 11) |
| description | Deskripsi, nullable |
| is_free | Boolean |
| quiz_duration_minutes | Durasi quiz dalam menit, nullable. Wajib diisi jika practice digunakan dalam Mode Quiz. |
| status | enum ContentStatus |
| **published_at** | **Waktu pertama kali dipublish, nullable. Diisi saat status pertama berubah ke `published`; tidak berubah jika di-unpublish dan re-publish.** |
| created_by | FK users, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.12 practice_questions

Record di tabel ini **tidak boleh dihapus** jika sudah direferensikan oleh `practice_session_questions`. Jika soal perlu dikeluarkan dari practice setelah ada session yang berjalan, buat versi baru practice.

| Field | Keterangan |
|---|---|
| id | Primary key |
| practice_id | FK practices |
| question_id | FK questions |
| order_index | Urutan soal |
| points | Bobot soal pada practice. Jika diisi (tidak null dan > 0), nilai ini **menggantikan** `questions.points` saat session dibuat. Jika null atau 0, nilai `questions.points` digunakan sebagai fallback. |
| created_at | Tanggal dibuat |

> **Aturan Presedensi Points (berlaku juga untuk `tryout_questions.points`):**
> `practice_questions.points` (atau `tryout_questions.points`) → jika null atau 0, fallback ke `questions.points`.
> Nilai yang dipakai di-snapshot ke `practice_session_questions.points` (atau `tryout_session_questions.points`) saat session dibuat, sehingga perubahan points setelah session berjalan tidak memengaruhi session yang sudah ada.

### 10.13 practice_sessions

Menyimpan sesi user saat mengerjakan practice dalam Mode Latihan atau Mode Quiz.

| Field | Keterangan |
|---|---|
| id | Primary key |
| practice_id | FK practices |
| user_id | FK users |
| mode | enum PracticeMode |
| status | enum SessionStatus. **Status awal selalu `in_progress` saat session dibuat.** |
| total_questions | Jumlah soal |
| total_correct | Jumlah benar |
| total_wrong | Jumlah salah |
| total_unanswered | Jumlah kosong |
| total_score | Skor total |
| total_max_score | Skor maksimal yang mungkin dicapai pada session ini. Diisi saat session dibuat berdasarkan jumlah `points` dari semua `practice_session_questions`. Digunakan oleh service layer untuk menghitung `total_max_score_aggregate` di `user_progress_snapshots`. |
| duration_minutes | Snapshot durasi quiz saat session dibuat, nullable untuk mode latihan |
| current_question_order | Urutan soal terakhir yang sedang/sudah dikerjakan user, untuk keperluan resume session. Diperbarui saat autosave. Nullable (null = belum ada soal dikerjakan). |
| started_at | Waktu session dibuat (= waktu user memulai practice) |
| submitted_at | Waktu submit, nullable |
| graded_at | Waktu graded, nullable |
| last_saved_at | Waktu autosave terakhir, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.14 practice_session_questions

Menyimpan snapshot soal dalam satu practice session agar histori tetap stabil.

Snapshot soal dalam practice session. Data ini bersifat immutable setelah dibuat.

| Field | Keterangan |
|---|---|
| id | Primary key |
| practice_session_id | FK practice_sessions |
| practice_question_id | FK practice_questions |
| question_id | FK questions |
| order_index | Urutan soal pada session (sudah memperhitungkan shuffle) |
| question_snapshot | Snapshot konten soal |
| option_snapshot | Snapshot opsi (termasuk urutan setelah shuffle) |
| correct_answer_snapshot | Snapshot kunci jawaban |
| points | Bobot nilai saat session dibuat |
| created_at | Tanggal dibuat |

**Catatan:** Pembahasan manual (`manual_explanation`) tidak di-snapshot. Halaman review akan selalu menampilkan pembahasan terbaru dari tabel `questions`. Pembahasan AI di-generate on-demand dan tidak disimpan ke database.

### 10.15 practice_answers

Menyimpan jawaban user untuk setiap soal dalam practice session.

| Field | Keterangan |
|---|---|
| id | Primary key |
| practice_session_id | FK practice_sessions |
| practice_session_question_id | FK practice_session_questions |
| question_type | enum QuestionType |
| selected_option_keys | JSON nullable. Digunakan untuk `multiple_choice` (satu nilai), `multiple_answer` (banyak nilai), dan `true_false` (satu nilai: **`"true"` atau `"false"` — selalu lowercase**). |
| answer_text | Jawaban teks, nullable. Digunakan untuk `short_answer`. |
| is_marked_for_review | Boolean. Hanya relevan untuk Mode Quiz. |
| is_correct | Boolean nullable |
| score | Skor final jawaban, nullable |
| max_score | Skor maksimal, nullable |
| grading_status | enum AnswerGradingStatus. Selalu `graded` setelah session di-submit karena semua tipe soal dinilai otomatis. |
| **grading_source** | **enum GradingSource. Selalu `auto`.** |
| graded_at | Waktu grading, nullable |
| answered_at | Waktu menjawab, nullable |
| last_saved_at | Waktu autosave terakhir, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.16 tryouts

Menyimpan master tryout/event yang dibuat admin.

| Field | Keterangan |
|---|---|
| id | Primary key |
| exam_type_id | FK exam_types |
| title | Judul tryout |
| slug | Slug unik |
| description | Deskripsi, nullable |
| is_free | Boolean |
| starts_at | Jadwal mulai, nullable — jika null tryout langsung tersedia sejak dipublish |
| ends_at | Jadwal selesai, nullable — jika null tryout tidak punya batas akhir |
| shuffle_questions | Boolean |
| shuffle_options | Boolean |
| allow_review_before_submit | Boolean |
| show_result_after_submit | Boolean |
| result_release_at | Jadwal rilis hasil, nullable |
| show_ranking_after_submit | Boolean |
| ranking_release_at | Jadwal rilis ranking, nullable |
| show_explanation_after_submit | Boolean |
| explanation_release_at | Jadwal rilis pembahasan, nullable |
| enforce_end_time | Boolean. Hanya bermakna jika `ends_at` tidak null. Validasi publish mencegah `enforce_end_time = true` jika `ends_at` null. |
| wrong_answer_penalty | DECIMAL(5,2), default `0.00`. Nilai skor yang diberikan untuk setiap jawaban **salah** pada soal objektif. Berlaku untuk seluruh section kecuali section yang memiliki override. Nilai harus `≤ 0`. Contoh: `0` = tidak ada penalti, `-1.00` = kurangi 1 poin, `-0.25` = kurangi 0.25 poin. |
| status | enum ContentStatus |
| **published_at** | **Waktu pertama kali dipublish, nullable. Diisi saat status pertama berubah ke `published`; tidak berubah meskipun tryout di-unpublish ke `draft` kemudian di-publish ulang. Lihat aturan transisi di Section 9.2a.** |
| created_by | FK users, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.17 tryout_sections

Menyimpan section/subtest dalam tryout beserta durasi dan urutannya.

| Field | Keterangan |
|---|---|
| id | Primary key |
| tryout_id | FK tryouts |
| subject_id | FK subjects |
| title | Nama section/subtest |
| description | Deskripsi, nullable |
| duration_minutes | Durasi section |
| order_index | Urutan section |
| wrong_answer_penalty | DECIMAL(5,2), nullable. Jika diisi, **menggantikan** nilai `tryouts.wrong_answer_penalty` untuk section ini. Jika null, section menggunakan nilai dari tryout induknya. Nilai harus `≤ 0` jika diisi. |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.18 tryout_questions

Record di tabel ini **tidak boleh dihapus** jika sudah direferensikan oleh `tryout_session_questions`. Jika soal perlu dikeluarkan dari section setelah ada session yang berjalan, buat versi baru tryout atau section.

| Field | Keterangan |
|---|---|
| id | Primary key |
| tryout_section_id | FK tryout_sections |
| question_id | FK questions |
| order_index | Urutan soal |
| points | Bobot soal pada tryout |
| created_at | Tanggal dibuat |

### 10.19 tryout_sessions

`tryout_sessions` adalah sesi user mengikuti satu tryout. Satu user hanya boleh memiliki satu session per tryout.

| Field | Keterangan |
|---|---|
| id | Primary key |
| tryout_id | FK tryouts |
| user_id | FK users |
| status | enum SessionStatus. **Status awal selalu `in_progress` saat session dibuat.** |
| total_questions | Jumlah soal tryout, diisi saat session dibuat |
| total_correct | Total benar, dihitung ulang saat seluruh tryout_session di-submit |
| total_wrong | Total salah, dihitung ulang saat seluruh tryout_session di-submit |
| total_unanswered | Total kosong, dihitung ulang saat seluruh tryout_session di-submit |
| total_score | Skor total dari semua section, diisi saat scoring selesai. Final hanya setelah semua jawaban berstatus graded. |
| total_max_score | Skor maksimal yang mungkin dicapai pada tryout ini. Diisi saat session dibuat berdasarkan jumlah `points` dari semua `tryout_session_questions`. Digunakan oleh service layer untuk menghitung `total_max_score_aggregate` di `user_progress_snapshots`. |
| **total_sections_started** | **Jumlah section yang pernah dibuka user (`started_at` tidak null pada section session). Diupdate saat tryout_session di-submit. Digunakan sebagai tie-breaker ranking pertama.** |
| duration_used_seconds | Total detik pengerjaan aktif untuk tie-breaker ranking. Dihitung sebagai jumlah `(submitted_at - started_at)` hanya untuk section dengan `started_at` tidak null. Section yang di-auto-submit dalam kondisi `pending` (started_at null) dikecualikan dari kalkulasi ini (kontribusi 0 detik). Diupdate saat tryout_session di-submit. |
| auto_submitted | Boolean |
| started_at | Waktu tryout session pertama kali dibuat (= saat user mengklik "Mulai Tryout"). Setara dengan `created_at` dalam praktiknya; dibedakan untuk menegaskan bahwa ini mewakili momen user secara sadar memulai tryout, bukan hanya timestamp pembuatan record. |
| submitted_at | Waktu submit, nullable |
| graded_at | Waktu graded, nullable |
| last_saved_at | Waktu autosave terakhir, nullable |
| cancelled_at | Waktu session dibatalkan (misalnya oleh admin karena error teknis), nullable |
| cancellation_reason | Alasan pembatalan, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.20 tryout_section_sessions

Menyimpan progres user pada setiap section/subtest tryout.

| Field | Keterangan |
|---|---|
| id | Primary key |
| tryout_session_id | FK tryout_sessions |
| tryout_section_id | FK tryout_sections |
| status | enum SessionStatus. **Status awal `pending`** — dibuat bersamaan dengan tryout_session sebelum user membuka section ini. |
| duration_minutes | Snapshot durasi section saat session dibuat |
| wrong_answer_penalty | DECIMAL(5,2), default `0.00`. **Snapshot** nilai penalti efektif saat session dibuat: diisi dari `tryout_sections.wrong_answer_penalty` jika tidak null, atau fallback ke `tryouts.wrong_answer_penalty`. Snapshot diperlukan agar perubahan penalti setelah session dibuat tidak memengaruhi scoring session yang sedang berjalan. |
| total_questions | Jumlah soal section |
| correct_count | Jumlah benar |
| wrong_count | Jumlah salah |
| unanswered_count | Jumlah kosong |
| score | Skor section |
| current_question_order | Posisi soal terakhir yang sedang/sudah dikerjakan user, nullable |
| started_at | Waktu section mulai (diisi saat user membuka section), nullable. Null berarti section belum pernah dibuka. |
| submitted_at | Waktu section submit, nullable |
| **graded_at** | **Waktu semua penilaian dalam section ini selesai, nullable. Diisi saat scoring section selesai dijalankan (termasuk untuk section yang di-auto-submit dari `pending`). Null berarti section belum selesai di-scoring.** |
| last_saved_at | Waktu autosave terakhir, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.21 tryout_session_questions

Menyimpan snapshot soal dalam satu tryout session agar histori tetap stabil.

Snapshot soal dalam tryout session. Data ini bersifat immutable setelah dibuat.

| Field | Keterangan |
|---|---|
| id | Primary key |
| tryout_session_id | FK tryout_sessions |
| tryout_section_session_id | FK tryout_section_sessions |
| tryout_question_id | FK tryout_questions |
| question_id | FK questions |
| order_index | Urutan soal pada session (sudah memperhitungkan shuffle) |
| question_snapshot | Snapshot konten soal |
| option_snapshot | Snapshot opsi (termasuk urutan setelah shuffle) |
| correct_answer_snapshot | Snapshot kunci jawaban |
| points | Bobot nilai saat session dibuat |
| created_at | Tanggal dibuat |

**Catatan:** Pembahasan manual (`manual_explanation`) tidak di-snapshot. Halaman review akan selalu menampilkan pembahasan terbaru dari tabel `questions`. Pembahasan AI di-generate on-demand dan tidak disimpan ke database.

### 10.22 tryout_answers

Menyimpan jawaban user untuk setiap soal dalam tryout session.

| Field | Keterangan |
|---|---|
| id | Primary key |
| tryout_session_id | FK tryout_sessions |
| tryout_section_session_id | FK tryout_section_sessions |
| tryout_session_question_id | FK tryout_session_questions |
| question_type | enum QuestionType |
| selected_option_keys | JSON nullable. Digunakan untuk `multiple_choice` (satu nilai), `multiple_answer` (banyak nilai), dan `true_false` (satu nilai: **`"true"` atau `"false"` — selalu lowercase**). |
| answer_text | Jawaban teks, nullable. Digunakan untuk `short_answer`. |
| is_marked_for_review | Boolean |
| is_correct | Boolean nullable |
| score | Skor final jawaban, nullable |
| max_score | Skor maksimal, nullable |
| grading_status | enum AnswerGradingStatus. Selalu `graded` setelah session di-submit. |
| **grading_source** | **enum GradingSource. Selalu `auto`.** |
| graded_at | Waktu grading, nullable |
| answered_at | Waktu menjawab, nullable |
| last_saved_at | Waktu autosave terakhir, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.23 subscriptions

Menyimpan langganan berbayar user untuk plan Pro atau Max.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| plan_code | enum PlanCode — hanya `pro` atau `max` yang dapat dibuat melalui sistem (baik Midtrans maupun admin manual). Nilai `free` tidak digunakan sebagai subscription record. |
| status | enum SubscriptionStatus |
| source | enum SubscriptionSource |
| starts_at | Waktu mulai |
| ends_at | Waktu selesai |
| activated_by_admin_id | FK users, nullable — diisi jika source adalah `manual` atau `admin_grant` |
| cancelled_by_admin_id | FK users, nullable |
| **cancelled_at** | **Waktu subscription dibatalkan (diisi saat status berubah ke `cancelled`), nullable** |
| cancellation_reason | Alasan pembatalan, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.24 payments

Menyimpan transaksi pembayaran Midtrans maupun transfer manual.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| subscription_id | FK subscriptions, nullable. Null saat payment pertama dibuat (menunggu konfirmasi). Diisi dengan ID subscription setelah: (a) webhook Midtrans sukses diterima dan subscription dibuat, atau (b) admin mengapprove payment manual dan subscription diaktifkan. |
| plan_code | enum PlanCode |
| amount | Bigint, nominal pembayaran dalam Rupiah tanpa desimal |
| status | enum PaymentStatus |
| gateway | enum PaymentGateway |
| payment_method | enum PaymentMethod, nullable |
| transaction_source | enum TransactionSource |
| gateway_order_id | ID order gateway, nullable. Diisi untuk pembayaran Midtrans; null untuk pembayaran manual admin. |
| gateway_transaction_id | ID transaksi gateway, nullable. Diisi setelah konfirmasi Midtrans; null untuk pembayaran manual. |
| payment_url | URL pembayaran Midtrans, nullable. Null untuk pembayaran manual. |
| paid_at | Waktu pembayaran sukses, nullable |
| expired_at | Waktu payment expired, nullable |
| proof_url | URL bukti transfer manual, nullable |
| notes | Catatan admin atau informasi tambahan, nullable |
| raw_payload | Payload gateway, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.25 monthly_usage

Menyimpan pemakaian bulanan user untuk enforcement limit plan.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| period | DATE, selalu hari pertama bulan dalam format YYYY-MM-01 |
| practice_sessions_count | Jumlah sesi Mode Latihan bulan ini |
| quiz_sessions_count | Jumlah sesi Mode Quiz bulan ini |
| tryout_sessions_count | Jumlah tryout session bulan ini |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

Counter diincrement saat session berhasil dibuat, bukan saat submit. Session `cancelled` tetap dihitung dalam monthly usage, kecuali pembatalan dilakukan admin karena error sistem. Ini termasuk session yang dibatalkan user sendiri saat memilih "Mulai Baru" — session cancelled lama **dan** session baru keduanya dihitung.

### 10.26 user_progress_snapshots

Tabel ini menggunakan strategi **upsert** — bukan insert per event. Setiap kombinasi `user_id + exam_type_id + subject_id` hanya memiliki satu record yang diperbarui setiap kali progress user berubah. `snapshot_date` mencerminkan kapan terakhir kali record ini diperbarui.

Record dengan `exam_type_id = 0` dan `subject_id = 0` (nilai sentinel integer) mewakili progress agregat keseluruhan user lintas semua exam type. Nilai `0` digunakan — bukan `NULL` — agar unique constraint di database bekerja dengan benar, mengingat MySQL tidak menganggap `NULL = NULL` dalam unique index.

**Penting:** Kolom `exam_type_id` dan `subject_id` pada tabel ini **tidak dienforce sebagai FK constraint di level database**, karena nilai sentinel `0` tidak memiliki row yang berkorespondensi di tabel `exam_types` maupun `subjects`. Integritas referensial untuk nilai non-zero (`exam_type_id > 0`, `subject_id > 0`) dan kebenaran nilai sentinel dijaga sepenuhnya di **service layer**. Deklarasikan kolom ini sebagai integer biasa (bukan FK) di schema Drizzle.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| exam_type_id | Integer (bukan FK). Nilai `0` = sentinel untuk "semua exam type". Nilai lain = ID dari `exam_types`. Dijaga di service layer. |
| subject_id | Integer (bukan FK). Nilai `0` = sentinel untuk "semua subject dalam exam type". Nilai lain = ID dari `subjects`. Dijaga di service layer. |
| total_questions_answered | Total soal yang dijawab user (benar + salah). Tidak termasuk soal yang dibiarkan kosong (unanswered). Sama dengan `total_correct + total_wrong`. |
| total_correct | Total benar |
| total_wrong | Total salah |
| total_max_score_aggregate | Total skor maksimal kumulatif dari semua session yang tercakup. Diakumulasikan dari field `total_max_score` pada `practice_sessions` dan `tryout_sessions` yang berstatus `graded`. Digunakan bersama `total_score_aggregate` untuk menghitung `average_score` sebagai persentase ternormalisasi. |
| total_score_aggregate | Total skor raw kumulatif dari semua session yang tercakup. |
| average_score | Rata-rata skor **sebagai persentase ternormalisasi** (0–100): `total_score_aggregate / total_max_score_aggregate × 100`. Dinormalisasi agar adil lintas session dengan jumlah soal dan bobot berbeda. Null jika belum ada session yang graded. |
| strongest_topics | JSON nullable: array `{ topic_id, topic_name, accuracy }`. `topic_name` diambil dan di-snapshot saat record ini terakhir diperbarui; jika admin mengganti nama topic setelah update terakhir, nilai ini bisa stale sampai progress user diperbarui kembali. |
| weakest_topics | JSON nullable: array `{ topic_id, topic_name, accuracy }`. Berlaku aturan staleness yang sama dengan `strongest_topics`. |
| snapshot_date | Tanggal terakhir record ini diperbarui |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.27 blog_categories

Menyimpan kategori artikel blog.

| Field | Keterangan |
|---|---|
| id | Primary key |
| name | Nama kategori |
| slug | Slug unik |
| description | Deskripsi, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.28 blog_posts

Menyimpan artikel blog, metadata SEO, tag, dan statistik tampilan.

| Field | Keterangan |
|---|---|
| id | Primary key |
| category_id | FK blog_categories, nullable |
| author_id | FK users, nullable |
| title | Judul artikel |
| slug | Slug unik |
| excerpt | Ringkasan, nullable |
| content | Konten artikel |
| thumbnail_url | Thumbnail, nullable |
| tags | JSON tag, nullable |
| status | enum ContentStatus |
| seo_title | SEO title, nullable |
| meta_description | Meta description, nullable |
| read_time_minutes | Estimasi waktu baca, nullable |
| view_count | Jumlah view artikel. Diincrement satu kali per unique session cookie saat halaman artikel dibuka oleh request non-bot. Middleware wajib memfilter request dengan User-Agent yang teridentifikasi sebagai bot/crawler sebelum melakukan increment. Race condition ditangani dengan atomic increment (`UPDATE blog_posts SET view_count = view_count + 1`). |
| published_at | Waktu publish, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

---

## 11. Unique Constraints Penting

| Tabel | Unique Key |
|---|---|
| users | email |
| users | google_id (jika tidak null, dijaga di service layer) |
| user_sessions | session_token_hash |
| exam_types | slug |
| subjects | exam_type_id + slug |
| topics | subject_id + slug |
| questions | tidak wajib unik |
| practices | **exam_type_id + slug** (scoped per exam type, bukan globally unique) |
| practice_questions | practice_id + question_id |
| practice_questions | practice_id + order_index |
| practice_session_questions | practice_session_id + practice_question_id |
| practice_answers | practice_session_question_id |
| tryouts | slug |
| tryout_sections | tryout_id + order_index |
| tryout_questions | tryout_section_id + question_id |
| tryout_questions | tryout_section_id + order_index |
| tryout_sessions | user_id + tryout_id (hanya untuk status selain `cancelled`, dijaga di service layer). **Catatan:** Jika sebuah session di-cancel oleh admin (karena error teknis, bukan pilihan user), constraint ini memungkinkan session baru dibuat. Namun kebijakan re-attempt diatur oleh service layer: admin yang melakukan cancel session karena error teknis **wajib secara eksplisit membuat session baru** untuk user tersebut melalui fitur admin (bukan otomatis). User sendiri tidak dapat memulai ulang tryout yang sudah pernah dimulai. Dengan demikian, aturan "Tidak ada re-attempt" tetap berlaku untuk alur normal user. |
| tryout_section_sessions | tryout_session_id + tryout_section_id |
| tryout_session_questions | tryout_session_id + tryout_question_id |
| tryout_answers | tryout_session_question_id |
| monthly_usage | user_id + period |
| user_progress_snapshots | user_id + exam_type_id + subject_id |
| payments | subscription_id — **ketika tidak null, harus unik secara global: satu payment per subscription** (one-to-one). Karena `subscription_id` hanya diisi setelah subscription dibuat, tidak akan ada dua payment yang merujuk ke subscription yang sama. Dijaga di service layer dengan transaction. |
| blog_categories | slug |
| blog_posts | slug |

Catatan: karena MySQL tidak mendukung partial unique index sederhana untuk semua kasus, beberapa aturan seperti satu subscription aktif per user dan satu payment pending aktif per user dijaga di service layer dengan transaction/locking.

---

## 12. Relasi Utama

- `exam_types` memiliki banyak `subjects`, `practices`, dan `tryouts`.
- `subjects` memiliki banyak `topics` dan `questions`.
- `questions` memiliki banyak `question_options`.
- `practices` memiliki banyak `practice_questions`.
- `practice_sessions` adalah sesi user mengerjakan `practices`.
- `practice_session_questions` adalah snapshot soal pada session.
- `practice_answers` adalah jawaban user pada practice session.
- `tryouts` memiliki banyak `tryout_sections`.
- `tryout_sections` memiliki banyak `tryout_questions`.
- `tryout_sessions` adalah sesi user mengikuti tryout.
- `tryout_sessions` memiliki banyak `tryout_section_sessions` (satu per section dalam tryout, dibuat sekaligus saat session pertama kali dibuat).
- `tryout_section_sessions` adalah sesi user pada satu section tryout.
- `tryout_session_questions` adalah snapshot soal pada tryout session.
- `tryout_answers` adalah jawaban user pada tryout session.
- `subscriptions` mencatat plan berbayar aktif user. Satu subscription memiliki tepat satu `payments` yang mereferensikannya melalui `payments.subscription_id` (one-to-one setelah payment sukses).
- `payments` mereferensikan `subscriptions` melalui `subscription_id` (nullable, diisi setelah payment sukses). Untuk mendapatkan payment dari subscription tertentu, query `payments WHERE subscription_id = ?`.
- `monthly_usage` mencatat konsumsi session user per bulan.
- `user_progress_snapshots` menyimpan ringkasan progress user per kombinasi exam type dan subject.
- `users` memiliki banyak `user_sessions` (satu per perangkat/login aktif).

---

## 13. Service Layer Rules

### 13.0 Aturan Global Data

- Semua field `slug` menggunakan format lowercase kebab-case: hanya huruf `a-z`, angka `0-9`, dan tanda hubung. Spasi dan karakter khusus dikonversi saat penyimpanan.
- **URL routing untuk `practices`:** Karena `practices.slug` unik per `exam_type_id` (bukan globally unique), URL practice harus menyertakan exam type sebagai konteks. Format URL yang wajib digunakan: `/latihan/{exam_type_slug}/{practice_slug}`. Format `/latihan/{practice_slug}` tanpa exam type **tidak boleh digunakan** karena slug tidak globally unique dan bisa ambigu. Endpoint API juga mengikuti pola ini: `GET /api/practices/{exam_type_slug}/{practice_slug}`.
- **URL routing untuk `tryouts`:** `tryouts.slug` globally unique, sehingga URL cukup `/tryout/{tryout_slug}` tanpa perlu prefix exam type.
- Pada `user_progress_snapshots`, jika `subject_id > 0`, maka `exam_type_id` juga harus `> 0` dan subject tersebut harus berasal dari exam type yang sama. Kombinasi `exam_type_id = 0` dan `subject_id > 0` tidak valid.
- Nilai sentinel `0` pada `user_progress_snapshots` hanya boleh digunakan untuk scope agregat, bukan untuk relasi nyata ke `exam_types` atau `subjects`.
- **Tiga level upsert `user_progress_snapshots`:** Setiap kali progress user diperbarui (setelah session berstatus `graded`), service layer melakukan **tiga upsert sekaligus dalam satu transaction**:
  1. `(user_id, exam_type_id=X, subject_id=Y)` — progress spesifik per subject pada exam type tersebut.
  2. `(user_id, exam_type_id=X, subject_id=0)` — progress agregat per exam type (seluruh subject dalam exam type X).
  3. `(user_id, exam_type_id=0, subject_id=0)` — progress agregat global (seluruh exam type dan subject).

  Ketiga record ini harus selalu disinkronkan. Jangan hanya update satu level. Jika session berasal dari exam type X dan subject Y, semua tiga record di atas harus di-upsert. `strongest_topics` dan `weakest_topics` hanya diisi pada record level subject (record no. 1); record agregat (no. 2 dan 3) mengosongkan field ini (null).

### 13.1 Auth dan Email

- Token verifikasi email disimpan dalam bentuk hash.
- Token hanya valid jika `used_at IS NULL` AND `invalidated_at IS NULL` AND `expires_at > NOW()`.
- Sebelum membuat token verifikasi email baru (resend), sistem mengisi `invalidated_at = NOW()` pada semua token verifikasi email lama milik user yang sama yang masih valid. Resend dibatasi maksimal 3 kali per jam per user untuk mencegah abuse pengiriman email.
- `used_at` diisi **hanya** ketika user benar-benar menggunakan token (klik link verifikasi). Jangan gunakan `used_at` untuk invalidasi sistematis.
- Google login **tidak** boleh otomatis mengambil alih akun yang `google_id`-nya masih null. Cek dilakukan berdasarkan `google_id`.
- Linking Google hanya boleh dari halaman profil setelah user login. Email Google yang dihubungkan wajib sama dengan email akun Nalarin.id pada MVP.

#### Rate Limiting

| Endpoint | Batas |
|---|---|
| Resend email verification | Maks 3 request per jam per user |
| AI generate soal (admin) | Maks 50 request per hari per admin |
| AI generate explanation (admin) | Maks 100 request per hari per admin |
| Pembahasan AI (user Pro/Max) | Maks 50 request per hari per user |

Nilai batas di atas adalah acuan awal dan dapat disesuaikan berdasarkan monitoring produksi.

### 13.2 Session Creation dan Monthly Usage

- Monthly usage dicek sebelum membuat session.
- Counter diincrement dalam transaction yang sama dengan pembuatan session.
- Period usage mengikuti `created_at` session dengan format bulan YYYY-MM-01.
- Session `cancelled` tetap dihitung dalam monthly usage, kecuali dibatalkan admin karena error sistem.
- Ketika user memilih "Mulai Baru" pada session yang masih `in_progress`, session lama di-cancel (tetap dihitung) dan session baru dibuat (counter diincrement kembali). Desain ini disengaja.

### 13.3 Practice Session Scoring

- **Kebijakan pembuatan baris jawaban:** Baris `practice_answers` **tidak** di-pre-create saat session dibuat. Baris dibuat pertama kali saat user menyimpan jawaban (autosave atau submit). Jika user tidak pernah menyentuh soal tertentu, tidak ada baris `practice_answers` untuk soal tersebut. Saat scoring dijalankan, sistem menentukan soal mana yang tidak memiliki baris jawaban dan memperlakukannya sebagai unanswered (skor 0, `is_correct = false`). `total_unanswered` dihitung sebagai `total_questions - jumlah baris practice_answers yang ada`.
- Semua jawaban dinilai otomatis saat session di-submit.
- Saat session di-submit, sistem mengisi `is_correct`, `score`, `grading_status = graded`, dan `grading_source = auto` untuk semua jawaban.
- Penilaian `multiple_choice`: skor penuh jika opsi yang dipilih memiliki `is_correct = true`.
- Penilaian `true_false`: membandingkan langsung nilai `selected_option_keys` dengan `questions.correct_answer_text`. Keduanya selalu disimpan dalam lowercase (`"true"` atau `"false"`). Bukan dari `question_options.is_correct`.
- Penilaian `short_answer`: membandingkan `answer_text` user dengan `questions.correct_answer_text` secara case-insensitive dengan trimming whitespace. Jika cocok, `is_correct = true` dan skor penuh. Jika tidak cocok atau kosong, `is_correct = false` dan skor 0.
- Jawaban kosong (unanswered) diisi `is_correct = false`, `score = 0`, `grading_status = graded`, `grading_source = auto`.
- Multiple answer mengikuti `scoring_rule` pada soal:
  - `all_or_nothing`: skor penuh hanya jika semua opsi benar dipilih **dan** tidak ada opsi salah yang dipilih. Satu pun opsi salah dipilih atau satu pun opsi benar tidak dipilih → skor `0`.
  - `partial`: skor proporsional. Formula: `max(0, (benar_dipilih - salah_dipilih) / total_opsi_benar × points)`, dibulatkan ke bawah.

### 13.4 Tryout Timer dan Auto Submit

- Timer section dihitung dari server time dan `started_at` section.
- `remaining_seconds` dari client hanya dianggap informasi tampilan/autosave, bukan sumber kebenaran utama.
- Jika waktu section habis, section auto submit dengan jawaban terakhir yang tersimpan.
- Jika `enforce_end_time` aktif dan `tryout.ends_at` sudah lewat, sistem menjalankan urutan berikut:
  1. Section yang masih `in_progress` langsung di-submit dengan jawaban terakhir yang tersimpan.
  2. Section berstatus `pending` (belum pernah dibuka user, `started_at = null`) ditandai `submitted` langsung — **melewati status `in_progress`**. Semua jawaban untuk section ini dianggap kosong dengan skor 0. Ini adalah transisi `pending → submitted` yang valid (lihat Section 9.3).
  3. `tryout_session` diubah menjadi `submitted` dengan flag `auto_submitted = true`.
  4. Scoring dijalankan atas jawaban yang sudah tersimpan.
- Auto submit dilakukan oleh cron job dan lazy check saat user request.

**Cleanup tryout session terbengkalai (tanpa `enforce_end_time`):**
Untuk tryout dengan `enforce_end_time = false` atau `ends_at = null`, jika `tryout_session` masih `in_progress` dan tidak ada aktivitas selama lebih dari **72 jam**, background job melakukan auto-submit. Aktivitas terakhir ditentukan dari nilai **terbaru** di antara:
- `tryout_sessions.last_saved_at` (autosave di level session)
- `last_saved_at` dari semua `tryout_section_sessions` milik session tersebut (autosave di level section/jawaban)
- Jika semua nilai di atas null (belum pernah ada autosave sama sekali), gunakan `tryout_sessions.started_at` sebagai waktu referensi.

Background job mengambil max dari semua nilai ini sebagai "waktu aktivitas terakhir". Jika `NOW() - waktu_aktivitas_terakhir > 72 jam`, jalankan auto-submit:
1. Section yang masih `in_progress` di-submit dengan jawaban terakhir yang tersimpan.
2. Section berstatus `pending` di-submit langsung dengan skor 0.
3. `tryout_session` diubah menjadi `submitted` dengan `auto_submitted = true`.
4. Scoring dijalankan.

Ini mencegah user terkunci permanen dari tryout yang sama akibat session terbengkalai.

### 13.5 Tryout Session Aggregate Scoring

Setelah seluruh tryout session di-submit (semua section selesai):

**Catatan kebijakan baris jawaban:** Sama dengan practice session, baris `tryout_answers` tidak di-pre-create. Baris dibuat saat user pertama kali menyimpan jawaban. Soal yang tidak memiliki baris `tryout_answers` dianggap unanswered (skor 0). `unanswered_count` per section dihitung sebagai `total_questions_in_section - jumlah baris tryout_answers yang ada untuk section tersebut`.

1. Sistem menilai semua jawaban objektif di seluruh section. Skor per-jawaban disimpan di `tryout_answers.score`. Setiap field agregat pada `tryout_section_sessions` dihitung dari jawaban-jawaban dalam section tersebut: `correct_count` = jumlah jawaban dengan `is_correct = true`, `wrong_count` = jumlah jawaban dengan `is_correct = false`, `unanswered_count` = jumlah jawaban kosong, `score` = sum dari `tryout_answers.score` dalam section.

   **Formula skor per jawaban (menggunakan `tryout_section_sessions.wrong_answer_penalty` sebagai `P`):**

   | Tipe soal | Benar | Salah | Unanswered |
   |---|---|---|---|
   | `multiple_choice` | `+points` | `P` (nilai penalti, ≤ 0) | `0` |
   | `true_false` | `+points` | `P` | `0` |
   | `multiple_answer` + `all_or_nothing` | `+points` (semua benar, tidak ada salah) | `P` | `0` |
   | `multiple_answer` + `partial` | `max(P, (benar_dipilih - salah_dipilih) / total_opsi_benar × points)` | — (formula sudah mencakup) | `0` |

   Catatan untuk `multiple_answer` + `partial`: nilai `P` menjadi **floor** (batas bawah) formula sehingga skor tidak bisa lebih rendah dari penalti. Jika `P = 0` (default), floor tetap `0` sesuai formula awal.

   Unanswered (tidak ada baris `tryout_answers`) selalu mendapat skor `0` tanpa memandang nilai `P`.
2. Sistem mengakumulasikan nilai dari semua `tryout_section_sessions` ke `tryout_sessions`: `total_correct += correct_count`, `total_wrong += wrong_count`, `total_unanswered += unanswered_count`, `total_score += score`. Perhatikan perbedaan nama field: `tryout_section_sessions` menggunakan `correct_count`, `wrong_count`, `unanswered_count`; sedangkan `tryout_sessions` menggunakan `total_correct`, `total_wrong`, `total_unanswered`.
3. `duration_used_seconds` dihitung sebagai jumlah `(submitted_at - started_at)` **hanya untuk section yang memiliki `started_at` tidak null**. Section yang di-auto-submit dari status `pending` (`started_at = null`) dikecualikan dari kalkulasi ini dan berkontribusi 0 detik. Dengan demikian user yang tidak mengerjakan section tidak mendapat keuntungan dari kalkulasi durasi.
4. `total_sections_started` diisi dengan jumlah section yang `started_at`-nya tidak null.
5. Setelah scoring selesai, status section berubah menjadi `graded`. `tryout_section_sessions.graded_at` untuk setiap section diisi dengan waktu scoring selesai. Section yang di-auto-submit dari `pending` (tidak ada jawaban sama sekali) juga mendapat `graded_at` diisi saat scoring dijalankan.
6. Setelah semua section di-submit dan scoring selesai, `total_score`, `total_correct`, `total_wrong`, dan `tryout_section_sessions.score` dihitung final, `tryout_sessions.graded_at` diisi, dan status berubah menjadi `graded`. Progress user diperbarui.

### 13.6 Tryout Ranking

- Ranking dihitung melalui query dari `tryout_sessions` berstatus `graded`.
- Tidak ada field `rank` di database.
- Semua session valid berkontribusi pada ranking, termasuk user Free.
- Tampilan ranking mengikuti akses plan.
- Urutan ranking: `total_score` tertinggi → `total_sections_started` terbanyak → `total_correct` tertinggi → `duration_used_seconds` tersingkat → `submitted_at` paling awal.

### 13.7 Subscription dan Payment

- **Saat `tryout_section_sessions` dibuat** (bersamaan dengan `tryout_session`), sistem mengisi `wrong_answer_penalty` pada setiap section session dari nilai efektif: gunakan `tryout_sections.wrong_answer_penalty` jika tidak null, fallback ke `tryouts.wrong_answer_penalty`. Nilai ini tidak berubah meskipun admin mengubah konfigurasi penalti setelah session dibuat.
- Active plan dibaca dari subscription aktif (`status = active` **AND** `ends_at > NOW()`). Pengecekan `ends_at > NOW()` dilakukan secara **langsung di query** sehingga sistem selalu memberikan hasil yang benar tanpa harus mengandalkan cron untuk memperbarui status.
- Cron job opsional (rekomendasi: setiap jam) memperbarui `status = expired` untuk record yang `status = active` AND `ends_at <= NOW()`. Cron ini bukan untuk correctness (lazy check sudah cover itu) melainkan untuk kebersihan data — agar kolom `status` di database mencerminkan kondisi aktual dan memudahkan query analitik tanpa perlu selalu join ke kondisi `ends_at`. Operasi ini harus idempotent (UPDATE hanya jika belum `expired`).
- Jika tidak ada subscription aktif (atau semua expired), user dianggap Free.
- Payment dibuat dengan `subscription_id = null` saat checkout dimulai.
- Setelah pembayaran sukses (Midtrans webhook atau admin approve), subscription baru dibuat dan `payments.subscription_id` diisi.
- Pembayaran sukses dari Midtrans wajib diproses idempotent berdasarkan `gateway_order_id`.
- **Jika webhook sukses Midtrans diterima untuk payment yang sudah berstatus `cancelled`, webhook diabaikan (no-op) dan tidak membuat subscription baru. Event ini wajib di-log untuk keperluan monitoring dan audit.**
- Pending payment ganda dicegah.
- User boleh cancel payment pending sendiri sebelum membayar.
- Cron/lazy check expired subscription harus idempotent.
- Admin cancel subscription aktif mengisi `cancelled_at = NOW()` dan `cancelled_by_admin_id`, mengubah status menjadi `cancelled`, dan langsung mengembalikan akses user ke Free.
- Admin hanya dapat membuat subscription manual untuk `plan_code = pro` atau `max`.
- Untuk subscription dengan source `admin_grant`, admin wajib menentukan `ends_at` secara manual. Tidak ada pengisian durasi otomatis.

### 13.8 Content Validation

**Validasi pada saat create dan update (early feedback):**
Service layer memvalidasi konsistensi relasi pada saat operasi create dan update, bukan hanya saat publish. Validasi yang dijalankan pada create/update:
- Subject harus berasal dari exam type yang sama dengan practice/tryout.
- Topic (jika diisi) harus berasal dari subject yang dipilih.
- Jika `starts_at` dan `ends_at` keduanya diisi, `ends_at` harus lebih besar dari `starts_at`.
- `enforce_end_time` tidak boleh diset `true` jika `ends_at` null atau belum diisi.
- `wrong_answer_penalty` pada `tryouts` dan `tryout_sections` harus bernilai `≤ 0`. Nilai positif tidak diizinkan karena semantiknya adalah penalti (pengurangan atau nol), bukan bonus.
- Jika validasi gagal, operasi ditolak dengan pesan error yang jelas. Admin tidak perlu menunggu proses publish untuk menemukan inkonsistensi relasi.

**Validasi tambahan pada saat publish:**
- Practice tidak boleh dipublish jika tidak punya soal.
- Practice tidak boleh dipublish jika `quiz_duration_minutes` kosong atau kurang dari/sama dengan 0 (karena Mode Quiz selalu tersedia, durasi wajib ada).
- Practice tidak boleh dipublish jika ada soal dalam practice yang belum `published`, sudah `archived`, atau subject-nya tidak sesuai dengan subject practice.
- Tryout tidak boleh dipublish jika tidak punya soal.
- Tryout tidak boleh dipublish jika section kosong atau durasi section belum diisi.
- Tryout tidak boleh dipublish jika `enforce_end_time = true` tetapi `ends_at = null`.
- Soal yang sudah digunakan session tidak boleh diubah pada bagian konten, opsi, atau kunci jawaban. Gunakan `archived` dan buat soal baru jika perlu perubahan besar.
- **Tryout: aturan edit berdasarkan kondisi session** (lihat Section 9.2a untuk detail lengkap):
  - `title` dan `description` selalu dapat diedit.
  - Jadwal, setting tampilan hasil/ranking/pembahasan, dan `allow_review_before_submit` hanya dapat diedit selama belum ada `tryout_sessions` untuk tryout tersebut.
  - Section, soal, `wrong_answer_penalty`, `shuffle_questions`, dan `shuffle_options` dilarang diedit setelah ada session apapun.
  - Transisi `published → draft` hanya diizinkan jika belum ada session. `published → archived` diizinkan kapan saja. `archived` bersifat final.
- Field `created_by` pada questions, practices, dan tryouts wajib diisi untuk konten yang dibuat melalui admin panel. Nullable hanya untuk data seed, migrasi, atau import sistem lama.
- Record `practice_questions` tidak boleh dihapus jika sudah direferensikan oleh `practice_session_questions`. Jika soal harus dikeluarkan dari practice, buat versi baru practice.
- Record `tryout_questions` tidak boleh dihapus jika sudah direferensikan oleh `tryout_session_questions`. Jika soal harus dikeluarkan dari section, buat versi baru tryout.
- `scoring_rule` wajib diisi (NOT NULL) untuk soal bertipe `multiple_answer`. Validasi ini diterapkan di level service layer dan import Excel.

---

## 14. Flow Utama

### 14.1 Flow Register via Google

1. User mengklik tombol "Daftar / Masuk dengan Google".
2. Sistem mengarahkan user ke halaman autentikasi Google.
3. Setelah Google mengonfirmasi identitas, sistem menerima email dan Google ID user.
4. Jika email belum ada di sistem, sistem membuat akun baru dengan `email_verified_at` terisi otomatis dan `google_id` diisi.
5. User langsung masuk ke sistem tanpa langkah verifikasi tambahan.

### 14.2 Flow Resend Email Verification

Hanya berlaku untuk akun lama yang dimigrasikan dan belum memiliki `email_verified_at`.

1. User yang belum terverifikasi memilih kirim ulang email verifikasi dari banner atau halaman profil.
2. Sistem mengisi `invalidated_at = NOW()` pada semua token verifikasi lama milik user yang masih valid.
3. Sistem membuat token baru dan mengirim email verifikasi baru.
4. Endpoint ini memiliki rate limit maks 3 kali per jam per user.

### 14.3 Flow Google Login dan Linking

1. User mengklik tombol login Google.
2. Jika email belum ada di sistem, sistem membuat user baru dengan `email_verified_at` terisi dan `google_id` diisi dari data Google.
3. Jika email sudah ada dan `google_id` sudah terhubung, login diizinkan.
4. Jika email sudah ada tetapi `google_id` masih null (kondisi safeguard untuk akun lama), login ditolak dengan pesan yang menjelaskan situasi.
5. User yang sudah login dapat menghubungkan Google dari halaman profil. Email Google wajib sama dengan email akun yang aktif; jika berbeda, linking ditolak.

### 14.4 Flow Latihan / Quiz

1. User memilih exam type.
2. User memilih subject.
3. User memfilter practice berdasarkan topic.
4. User memilih practice.
5. User memilih Mode Latihan atau Mode Quiz.
6. Sistem mengecek akses dan limit.
7. Sistem membuat session dengan status awal `in_progress` dan snapshot soal.
8. User mengerjakan soal.
9. Jawaban dan `current_question_order` autosave.
10. Session selesai melalui submit atau auto submit (Mode Quiz).
11. Sistem menilai semua jawaban secara otomatis, mengisi `grading_source = auto`.
12. Status session berubah menjadi `graded`. Progress diperbarui.

### 14.5 Flow Cancel Pending Payment

1. User membuka halaman profil atau halaman checkout dan melihat payment pending aktif.
2. User memilih batalkan payment.
3. Sistem mengupdate status payment menjadi `cancelled` di database.
4. Jika gateway adalah Midtrans, sistem memanggil Midtrans Cancel API untuk membatalkan transaksi di sisi Midtrans.
5. Jika Midtrans API gagal dipanggil (timeout/error), payment tetap ditandai `cancelled` di sisi kita. Midtrans akan expire sendiri sesuai waktu yang ditetapkan. Jika kemudian Midtrans mengirim webhook sukses untuk payment yang sudah `cancelled`, webhook tersebut **diabaikan (no-op)** dan tidak membuat subscription baru (lihat Section 13.7).
6. Setelah cancelled, user dapat membuat payment baru untuk plan yang sama atau berbeda.

### 14.6 Flow Tryout

1. User membuka daftar tryout.
2. User memilih tryout aktif.
3. Sistem mengecek akses dan limit.
4. Sistem memastikan user belum punya session untuk tryout tersebut.
5. Sistem membuat tryout session (status `in_progress`), section sessions (semua status `pending`), dan snapshot soal.
6. User mengerjakan section sesuai timer.
7. Section selesai melalui submit atau auto submit.
8. Setelah semua section selesai, tryout session di-submit.
9. Sistem menilai semua jawaban secara otomatis, mengisi `grading_source = auto`.
10. Status session berubah menjadi `graded`.
11. Ranking tersedia melalui query jika plan dan setting mengizinkan.
12. Progress diperbarui.

### 14.7 Flow Manual Payment dan Admin Approval

1. User memilih plan Pro atau Max di halaman checkout.
2. User memilih metode pembayaran manual (transfer bank).
3. Sistem membuat payment record dengan `status = pending`, `gateway = manual`, `transaction_source = user_checkout`, dan `subscription_id = null`. Jika user mengunggah bukti transfer, file/URL bukti disimpan di `payments.proof_url`.
4. Sistem menampilkan instruksi pembayaran (nomor rekening, jumlah yang harus ditransfer).
5. User melakukan transfer dan mengunggah bukti atau mengonfirmasi melalui UI.
6. Admin membuka daftar payment pending di panel admin.
7. Admin memverifikasi bukti transfer dan memilih **Approve**.
8. Sistem membuat subscription baru dengan `status = active`, `source = manual`, `starts_at = waktu sekarang`, `ends_at = starts_at + durasi plan`, `activated_by_admin_id` diisi ID admin.
9. Sistem mengupdate `payments.subscription_id` dengan ID subscription baru, `payments.status = paid`, `payments.paid_at` diisi. Field `transaction_source` **tidak diubah** — tetap `user_checkout` karena payment diinisiasi oleh user, bukan admin. Admin tidak menginisiasi payment ini, hanya memverifikasi dan mengapprovenya.
10. User mendapatkan akses Pro atau Max sesuai plan yang dibeli.

---

## 15. Phase Development

### Phase 1 — Foundation

- Setup **Next.js 16** App Router, TypeScript 5, Tailwind CSS v4, Drizzle ORM, MySQL2.
- Install dan konfigurasi **shadcn/ui** (init, tema, komponen dasar: Button, Input, Form, Dialog, Card, Toast via Sonner).
- Konfigurasi **Tiptap** (`@tiptap/react` + `@tiptap/starter-kit`) sebagai rich text editor.
- Konfigurasi **Zod** + **React Hook Form** + `@hookform/resolvers` untuk form validation.
- Setup **iron-session** untuk server-side session management (cookie-based, tabel `user_sessions`).
- Login Google via OAuth 2.0 manual (no auto-link).
- Verifikasi email dan Resend/React Email untuk email transaksional (khusus akun migrasi).
- Profile dasar.
- Admin dashboard awal dengan layout shadcn/ui.

### Phase 2 — Content dan Bank Soal

- Exam types seed (via Drizzle seed).
- Subjects dan topics.
- CRUD questions (termasuk penanganan true_false, multiple_answer dengan scoring_rule wajib; field `manual_explanation` sebagai satu-satunya pembahasan yang disimpan).
- Question options.
- Import Excel via **SheetJS** (`xlsx`).
- Generate soal dan explanation AI (via Route Handler ke AI provider).
- Practices dan practice questions (slug scoped per exam_type_id, URL `/latihan/{exam_type_slug}/{practice_slug}`, field published_at).

### Phase 3 — Practice dan Quiz

- Practice sessions (dengan field `current_question_order`, status awal `in_progress`).
- Snapshot soal.
- Autosave (jawaban + posisi soal).
- Mode Latihan (berurutan, wajib jawab, konfirmasi langsung tampilkan hasil per soal).
- Mode Quiz (timer, navigasi bebas, hasil setelah submit).
- Resume session.
- Review jawaban dan pembahasan.
- Pembahasan AI on-demand per soal (Pro/Max, via Route Handler).

### Phase 4 — Tryout

- Tryouts (field `published_at`).
- Tryout sections.
- Tryout questions.
- Tryout sessions (status awal `in_progress`, field `total_sections_started`, `cancelled_at`).
- Tryout section sessions (status awal `pending`, field `graded_at`).
- Timer section.
- Auto submit (termasuk transisi `pending → submitted` untuk section yang belum dibuka).
- Cleanup tryout session terbengkalai (72h threshold).
- Review hasil.
- Ranking query dinamis (tie-breaker `total_sections_started`).

### Phase 5 — Monetisasi

- Plan config.
- Midtrans payment.
- Subscription (field `cancelled_at`).
- Manual payment dan admin approval flow.
- Manual subscription/admin grant.
- Cancel subscription dan force downgrade.
- Monthly usage limit.
- Webhook race condition handling (cancelled payment + incoming success webhook).

### Phase 6 — Progress dan Blog

- User progress snapshots (kolom `exam_type_id` dan `subject_id` sebagai integer non-FK; sentinel `0` untuk record agregat; uniqueness dijaga service layer; `average_score` sebagai persentase ternormalisasi menggunakan `total_score_aggregate` dan `total_max_score_aggregate`).
- Progress page.
- Blog categories dan posts.
- Landing page final.

---

## 16. Success Metrics

- Jumlah user terdaftar.
- Persentase user yang memverifikasi email (khusus akun migrasi).
- Jumlah practice session dibuat.
- Jumlah quiz session dibuat.
- Jumlah tryout session dibuat.
- Completion rate latihan dan tryout.
- Conversion Free ke Pro/Max.
- Revenue bulanan.
- Jumlah artikel blog terindeks.
- Akurasi import soal.
- Jumlah soal dan pembahasan yang berhasil di-generate AI.

---
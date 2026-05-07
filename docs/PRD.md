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
- Memudahkan admin mengelola user, subscriber/payment, soal, practice, tryout, grading jawaban subjektif, dan blog.

---

## 3. Scope MVP

### 3.1 In Scope

- Auth lengkap: register, login, login Google, verifikasi email, lupa password, reset password, ubah email, logout.
- Landing page publik.
- Bank soal / latihan dengan Mode Latihan dan Mode Quiz.
- Tryout rutin multi-section/subtest.
- Auto save jawaban.
- Auto submit saat waktu habis.
- Acak soal dan acak opsi.
- Pengaturan hasil langsung setelah submit.
- Pengaturan review jawaban sebelum submit.
- Mode navigasi: bebas dan berurutan.
- Review jawaban dan pembahasan untuk latihan, quiz, dan tryout.
- Ranking tryout berbasis query dinamis.
- Progress / tracking belajar.
- Blog.
- Account profile dan ubah password.
- Payment Midtrans.
- Admin panel.
- Import soal via Excel.
- Generate soal dengan AI.
- Generate pembahasan dengan AI.
- Koreksi manual dan AI untuk isian singkat dan esai.

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
- Riwayat grading (grading history) — hanya feedback terakhir yang disimpan.

---

## 4. Role dan Hak Akses

### 4.1 Role

Role hanya terdiri dari:

- `user`
- `admin`

### 4.2 User

User dapat:

- Register dan login.
- Login menggunakan Google.
- Melakukan verifikasi email.
- Mengakses landing page dan blog.
- Mengakses latihan sesuai plan.
- Memulai Mode Latihan atau Mode Quiz sesuai akses plan.
- Mengikuti tryout sesuai akses plan.
- Melihat hasil, review jawaban, dan pembahasan sesuai setting dan plan.
- Melihat ranking tryout jika plan mengizinkan.
- Melihat progress belajar.
- Mengubah profil, email, dan password.
- Membeli plan Pro atau Max jika tidak sedang memiliki subscription aktif.

### 4.3 Admin

Admin dapat:

- Manage users CRUD.
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
- Generate questions dengan AI.
- Generate pembahasan dengan AI.
- Manage practices.
- Manage tryouts.
- Melihat hasil tryout user.
- Mengoreksi jawaban isian singkat dan esai secara manual atau AI.
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
      fullExplanation: false,
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
      fullExplanation: true,
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
      fullExplanation: true,
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
- Jika plan user mengizinkan pembahasan penuh tetapi practice/tryout belum merilis pembahasan, pembahasan tetap tidak tampil.
- Dengan kata lain, akses fitur membutuhkan dua kondisi: setting konten mengizinkan **dan** plan user mengizinkan.

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
- **Google OAuth** — diimplementasikan manual via Google OAuth 2.0 REST API atau menggunakan `@auth/core` sebagai thin wrapper. Tidak menggunakan NextAuth/Auth.js penuh karena logika linking Google di PRD ini sangat spesifik (wajib email sama, no auto-takeover).

### 6.6 Rich Text Editor

- **Tiptap** — rich text editor untuk konten soal, pembahasan, dan blog. Gunakan package `@tiptap/react`, `@tiptap/starter-kit`, dan ekstensi tambahan sesuai kebutuhan (misalnya `@tiptap/extension-image`, `@tiptap/extension-table`).

### 6.7 Utilitas

- **date-fns** — manipulasi dan formatting tanggal. Ringan dan tree-shakeable.
- **xlsx** (`SheetJS`) — parsing file Excel untuk fitur import soal.
- **midtrans-node** — official Midtrans SDK untuk Node.js, digunakan di Route Handlers untuk membuat transaksi dan memverifikasi webhook signature.
- **Resend** (atau **Nodemailer**) — pengiriman email transaksional (verifikasi, reset password). Resend direkomendasikan karena DX yang lebih baik dan terintegrasi dengan React Email.
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

User dapat register, login, login Google, verifikasi email, lupa password, reset password, ubah email, logout, dan mengelola keamanan akun.

#### Session Management

- Auth menggunakan server-side session cookie (tidak menggunakan JWT stateless).
- Session disimpan di tabel `user_sessions` (lihat Section 10.2).
- Session aktif selama **7 hari sejak login (fixed window)**. `expires_at` ditetapkan saat session dibuat dan **tidak diperpanjang** berdasarkan aktivitas. `last_active_at` diperbarui setiap request untuk keperluan monitoring saja, bukan untuk memperpanjang session.
- Setiap login baru membuat session baru. Multi-device diizinkan.
- Logout menginvalidasi session aktif di sisi server dengan mengisi `user_sessions.revoked_at`. Session valid hanya jika `revoked_at` masih null dan `expires_at` lebih besar dari waktu saat ini.
- Tidak ada fitur "logout semua perangkat" pada MVP.

#### Acceptance Criteria

- Email user harus unik.
- Password disimpan dalam bentuk hash.
- Setelah register email/password, sistem mengirim email verifikasi.
- User yang belum verifikasi email dapat login, tetapi akses latihan, quiz, tryout, dan payment dibatasi sampai email diverifikasi.
- Login Google membuat akun baru jika email belum ada, dan email dianggap terverifikasi.
- Jika email Google sudah terdaftar tetapi `google_id` user masih null (belum pernah dihubungkan ke Google), login Google **ditolak**. User harus login dengan email/password terlebih dahulu, lalu menghubungkan Google dari halaman profil.
- Jika email Google sudah terdaftar dan `google_id` sudah terhubung (tidak null), login Google diizinkan tanpa memandang ada-tidaknya password.
- Google account linking hanya boleh dilakukan dari halaman profil setelah user terautentikasi. Untuk MVP, email Google yang dihubungkan wajib sama dengan email akun Nalarin.id. Jika berbeda, sistem menolak linking dan meminta user mengganti email akun terlebih dahulu atau memakai akun Google yang sesuai.
- Reset password memakai token yang di-hash dan memiliki masa kedaluwarsa.
- Ubah email memakai token verifikasi ke email baru sebelum email utama diganti.

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
5. User memilih Mode Latihan atau Mode Quiz jika practice mendukung keduanya.
6. Sistem mengecek email verified, akses plan, dan limit bulanan.
7. Sistem membuat `practice_session` (dengan status awal `in_progress`) dan snapshot soal.
8. User mengerjakan soal.
9. Sistem autosave jawaban dan posisi soal terakhir (`current_question_order`).
10. User submit atau waktu habis jika mode quiz.
11. Sistem menghitung skor, menampilkan hasil, review, dan pembahasan sesuai setting dan plan.
12. Progress diperbarui setelah session berstatus `graded`.

#### Mode Latihan

- Tanpa timer.
- Feedback bisa langsung setelah user menjawab.
- Cocok untuk belajar santai dan memahami konsep.
- User dapat berpindah soal sesuai mode navigasi yang diatur.

#### Mode Quiz

- Menggunakan timer.
- Feedback tampil setelah submit.
- Cocok untuk simulasi singkat.
- Timer dihitung dari server time.
- Jika waktu habis, session auto submit.

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

- **Bebas:** user dapat lompat ke nomor soal mana pun dalam session/section aktif.
- **Berurutan:** user mengerjakan soal sesuai urutan; lompat bebas tidak tersedia.

#### Status Soal

- Belum dijawab.
- Dijawab.
- Ditandai ragu-ragu.
- Dijawab dan ditandai ragu-ragu.
- Aktif.
- Terkunci setelah submit atau waktu habis.

#### Acceptance Criteria

- User boleh mengosongkan jawaban.
- Soal kosong dihitung sebagai unanswered dan score 0.
- Jika review sebelum submit aktif, sistem menampilkan ringkasan dijawab, belum dijawab, dan ragu-ragu.
- Sistem dapat menampilkan warning jika masih ada soal kosong, tetapi tidak memblokir submit.

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
10. Sistem menilai jawaban objektif.
11. Jika ada jawaban subjektif, status menjadi `grading`.
12. Setelah semua jawaban subjektif selesai dikoreksi, status menjadi `graded`.
13. Hasil, review, pembahasan, ranking, dan progress tersedia sesuai setting dan plan.

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

- User dapat melihat daftar soal, jawaban user, jawaban benar, status benar/salah/kosong, dan pembahasan.
- Jika tryout/section memiliki `wrong_answer_penalty ≠ 0`, halaman review menampilkan keterangan penalti per soal yang salah (contoh: "−1 poin") agar user memahami kontribusi tiap jawaban terhadap skor akhir.
- Pembahasan dapat berupa manual atau hasil AI.
- Pembahasan **tidak di-snapshot** saat session dibuat. Jika admin memperbarui pembahasan setelah session berjalan, review historis akan menampilkan pembahasan terbaru. Desain ini disengaja agar user selalu mendapatkan pembahasan terbaik yang tersedia.
- Akses pembahasan mengikuti setting konten dan plan user.
- Filter review: semua, benar, salah, belum dijawab.

### 7.7 Ranking Tryout

#### Deskripsi

Ranking hanya berlaku untuk tryout dan dihitung secara dinamis dari query.

#### Acceptance Criteria

- Ranking tidak disimpan sebagai field pada `tryout_sessions`.
- Ranking hanya menghitung `tryout_sessions` berstatus `graded`.
- Free user yang mengikuti tryout tetap berkontribusi dalam perhitungan ranking jika session berstatus graded.
- Free user tidak dapat melihat leaderboard/ranking jika plan tidak mengizinkan.
- Ranking diurutkan berdasarkan `total_score` tertinggi.
- Tie breaker berurutan: jumlah section yang diselesaikan secara aktif (`total_sections_started`) terbanyak, lalu `total_correct` tertinggi, lalu `duration_used_seconds` tersingkat, lalu `submitted_at` paling awal.
- `total_sections_started` dihitung dari jumlah section yang memiliki `started_at` tidak null (artinya pernah dibuka user), sehingga section yang di-auto-submit dalam kondisi `pending` tidak dihitung sebagai kontribusi aktif. Ini mencegah user yang tidak mengerjakan section mendapat keuntungan tie-breaker durasi.

### 7.8 Progress / Tracking

- Progress diperbarui setelah practice session atau tryout session berstatus `graded`.
- User hanya dapat melihat progress miliknya sendiri.
- Data progress dapat difilter berdasarkan exam type, subject, dan periode.
- Strongest/weakest topics disimpan sebagai JSON array of objects: `topic_id`, `topic_name`, dan `accuracy`.

### 7.9 Blog

- User dapat melihat daftar artikel.
- User dapat membaca detail artikel.
- Artikel dapat memiliki kategori dan tag.
- Blog digunakan untuk edukasi, SEO, pengumuman, dan panduan belajar.

### 7.10 Account Profile dan Ubah Password

User dapat:

- Melihat profil.
- Mengubah nama.
- Mengubah foto profil opsional.
- Mengubah kelas/tingkat pendidikan.
- Mengubah WhatsApp/phone.
- Mengubah email dengan verifikasi email baru.
- Mengubah password.
- Menghubungkan Google login dari halaman profil.
- Melihat status subscription aktif.
- Melihat riwayat transaksi.

---

## 8. Fitur Admin

### 8.1 Manage Users

Admin dapat:

- Melihat daftar user.
- Melihat detail user.
- Mengubah data user.
- Mengubah status user.
- Melihat riwayat subscription dan payment.
- Melihat riwayat practice dan tryout.

### 8.2 Manage Subscribers dan Payment

Admin dapat:

- Melihat daftar payment.
- Melihat detail payment.
- Approve payment manual (lihat Flow 14.9).
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
- Mengisi pembahasan manual.
- Generate soal dengan AI.
- Generate pembahasan dengan AI.
- Import soal via Excel.

#### Penanganan Soal Berdasarkan Tipe

Setiap tipe soal memiliki aturan penyimpanan data yang berbeda:

| Tipe | `question_options` | `correct_answer_text` | Jawaban User |
|---|---|---|---|
| `multiple_choice` | Wajib ada (min. 2), `is_correct = true` untuk satu opsi | Null | `selected_option_keys` (JSON, satu nilai) |
| `multiple_answer` | Wajib ada (min. 2), `is_correct = true` untuk ≥2 opsi | Null | `selected_option_keys` (JSON, banyak nilai) |
| `true_false` | Wajib ada tepat 2 opsi dengan label `True` dan `False`; `is_correct` pada kedua opsi **selalu diisi `false`** dan **tidak digunakan** sebagai sumber kebenaran | Wajib diisi: `"true"` atau `"false"` — ini sumber kebenaran | `selected_option_keys` (JSON, satu nilai: **`"true"` atau `"false"` — selalu lowercase**) |
| `short_answer` | Tidak ada | Referensi jawaban, opsional | `answer_text` |
| `essay` | Tidak ada | Rubrik singkat, opsional | `answer_text` |

**Catatan khusus `true_false`:** Dua opsi di `question_options` dibuat agar tampilan UI konsisten dengan soal pilihan lainnya. Jawaban user **selalu disimpan dalam lowercase** (`"true"` atau `"false"`) di `selected_option_keys`. Penilaian otomatis dilakukan dengan membandingkan langsung nilai `selected_option_keys` dengan `correct_answer_text` — keduanya sudah lowercase sehingga tidak perlu konversi saat penilaian.

### 8.4 Import Question via Excel

#### Kolom Wajib

- `exam_type_slug`
- `subject_slug`
- `topic_slug` — opsional
- `question_type` — nilai: `multiple_choice`, `multiple_answer`, `short_answer`, `essay`, `true_false`
- `difficulty` — nilai: `easy`, `medium`, `hard`
- `question_content`
- `option_a` sampai `option_e` — untuk `multiple_choice` dan `multiple_answer`, minimal `option_a` dan `option_b` wajib diisi; opsi lain diisi sesuai kebutuhan. Untuk `true_false`, hanya `option_a = True` dan `option_b = False` yang wajib; `option_c` sampai `option_e` dikosongkan.
- `correct_answer` — format:
  - `multiple_choice`: satu huruf, contoh `A`
  - `multiple_answer`: huruf dipisah koma, contoh `A,C`
  - `true_false`: nilai `true` atau `false`
  - `short_answer` dan `essay`: teks referensi jawaban, opsional
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
- Menentukan Mode Latihan, Mode Quiz, atau keduanya.
- Menentukan durasi quiz jika mode quiz tersedia.
- Menambahkan soal ke practice.
- Mengatur acak soal, acak opsi, review jawaban, hasil langsung, pembahasan, dan mode navigasi.

### 8.6 Manage Tryout

Admin dapat:

- Membuat tryout.
- Menentukan exam type.
- Menentukan jadwal mulai dan selesai.
- Menentukan gratis atau berbayar.
- Menambahkan section/subtest.
- Menentukan durasi tiap section.
- Menambahkan soal ke section.
- Mengatur acak soal, acak opsi, review jawaban, hasil langsung, pembahasan, ranking, mode navigasi, dan enforce end time.
- **Menentukan nilai skor untuk jawaban salah (`wrong_answer_penalty`) di level tryout.** Nilai ini berlaku untuk semua section. Contoh: `0` = tidak ada penalti, `-1` = dikurangi 1 poin, `-0.25` = dikurangi 0.25 poin. Default `0`.
- **Menentukan override `wrong_answer_penalty` per section**, jika section tertentu membutuhkan aturan penalti berbeda dari level tryout.
- Melihat peserta dan hasil.

> **Catatan:** Pengaturan acak soal (`shuffle_questions`) dan acak opsi (`shuffle_options`) berlaku secara global untuk semua section dalam satu tryout. Acak per-section tidak didukung pada MVP.

> **Penalti Jawaban Salah:** `wrong_answer_penalty` adalah nilai skor yang diberikan untuk setiap jawaban **salah** (bukan unanswered). Unanswered selalu mendapat skor `0` tanpa memandang nilai penalti. Penalti diterapkan pada soal objektif (`multiple_choice`, `true_false`, `multiple_answer` dengan `all_or_nothing`). Untuk `multiple_answer` dengan `partial`, nilai penalti menjadi batas bawah (floor) dari formula partial scoring. Soal subjektif (`short_answer`, `essay`) tidak dikenai penalti otomatis karena dinilai manual/AI.

#### Validasi Publish Tryout

Tryout tidak boleh dipublish jika:

- Tidak memiliki section.
- Ada section tanpa soal.
- Ada section tanpa durasi.
- Jadwal mulai dan selesai tidak valid (jika keduanya diisi, `ends_at` harus lebih besar dari `starts_at`).
- `enforce_end_time = true` tetapi `ends_at` null. `enforce_end_time` membutuhkan `ends_at` yang valid agar sistem tahu kapan auto-submit dipicu.
- Exam type section/subject tidak sesuai dengan exam type tryout.

### 8.7 Grading Jawaban Subjektif

Admin dapat:

- Melihat jawaban isian singkat dan esai yang perlu dikoreksi.
- Mengoreksi secara manual (`grading_source = manual`).
- Meminta koreksi otomatis AI (`grading_source = ai`).
- Menimpa skor dan feedback sebelumnya. **Hanya feedback terakhir yang disimpan** (`grading_feedback`); riwayat grading sebelumnya tidak dipertahankan pada MVP. Jika audit trail grading diperlukan, fitur ini dapat dipertimbangkan di iterasi berikutnya.
- Menandai jawaban sebagai `needs_review`.

#### Chain Grading

1. Jawaban subjektif masuk status `pending`.
2. Admin atau AI mengisi skor dan feedback → status jawaban menjadi `graded`. Field `grading_source` diisi sesuai penilai (`manual` atau `ai`).
3. Admin dapat menandai jawaban sebagai `needs_review` jika membutuhkan tinjauan ulang. Status `needs_review` berarti jawaban sudah memiliki skor sementara, tetapi belum final.
4. Jawaban berstatus `needs_review` dianggap **belum selesai** dan memblokir chain grading. Session tidak akan menjadi `graded` selama masih ada jawaban berstatus `pending` atau `needs_review`.
5. Setelah satu jawaban diubah menjadi `graded`, sistem mengecek apakah semua jawaban subjektif dalam session sudah berstatus `graded` (bukan `pending` atau `needs_review`).
6. Jika semua sudah `graded`, sistem menghitung ulang skor session.
7. Status session berubah menjadi `graded`.
8. Progress user diperbarui.

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
| QuestionType | multiple_choice, multiple_answer, short_answer, essay, true_false |
| QuestionDifficulty | easy, medium, hard |
| ScoringRule | all_or_nothing, partial |
| ContentStatus | draft, published, archived |
| SessionStatus | pending, in_progress, submitted, grading, graded, cancelled |
| PracticeMode | practice, quiz |
| NavigationMode | free, sequential |
| AnswerGradingStatus | not_required, pending, graded, needs_review |
| **GradingSource** | **manual, ai, auto** |
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

### 9.3 SessionStatus Semantics

- `pending`: section session sudah dibuat tetapi belum dibuka user. **Hanya digunakan pada `tryout_section_sessions`.**
- `in_progress`: session sedang dikerjakan user.
- `submitted`: session telah disubmit, menunggu scoring atau grading.
- `grading`: ada jawaban subjektif yang menunggu koreksi manual/AI.
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

- `auto`: jawaban dinilai otomatis oleh sistem saat session di-submit (untuk jawaban objektif: `multiple_choice`, `multiple_answer`, `true_false`). Diisi oleh scoring engine, bukan admin.
- `manual`: jawaban dinilai secara manual oleh admin.
- `ai`: jawaban dinilai menggunakan AI grading yang diminta admin.

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
| password_hash | Hash password, nullable untuk akun Google-only |
| google_id | ID Google OAuth, nullable |
| avatar_url | Foto profil, nullable |
| role | enum UserRole |
| status | enum UserStatus |
| gender | enum Gender, nullable |
| phone_number | Nomor phone/WhatsApp, nullable |
| **school_class** | **Kelas/tingkat pendidikan user, varchar, nullable. Contoh: "12 IPA", "Kelas 11", "S1 Semester 3".** |
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

### 10.4 password_reset_tokens

Menyimpan token reset password yang dikirim ke email user.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| token_hash | Hash token reset |
| expires_at | Kedaluwarsa token |
| used_at | Waktu token digunakan oleh user secara genuine, nullable |
| **invalidated_at** | **Waktu token diinvalidasi oleh sistem (saat token reset baru dibuat), nullable** |
| created_at | Tanggal dibuat |

Token dianggap valid jika: `used_at IS NULL` AND `invalidated_at IS NULL` AND `expires_at > NOW()`.

### 10.5 email_change_tokens

Menyimpan token untuk memverifikasi email baru sebelum email akun diganti.

| Field | Keterangan |
|---|---|
| id | Primary key |
| user_id | FK users |
| new_email | Email baru yang akan diverifikasi |
| token_hash | Hash token verifikasi |
| expires_at | Kedaluwarsa token |
| used_at | Waktu token digunakan oleh user secara genuine, nullable |
| **invalidated_at** | **Waktu token diinvalidasi oleh sistem (saat token ubah email baru dibuat), nullable** |
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
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

Data awal exam type disimpan di database melalui seed: UTBK, UTUL UGM, SIMAK UI, dan CPNS. Admin dapat mengedit nama dan deskripsi exam type yang sudah ada melalui panel admin, tetapi tidak dapat menambah atau menghapus exam type pada MVP.

### 10.7 subjects

Menyimpan mata uji, subtest, atau subject di bawah exam type.

| Field | Keterangan |
|---|---|
| id | Primary key |
| exam_type_id | FK exam_types |
| name | Nama subject/subtest |
| slug | Slug unik per exam type |
| description | Deskripsi, nullable |
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
| correct_answer_text | Kunci teks. Untuk `true_false`: wajib diisi `"true"` atau `"false"` — ini sumber kebenaran, bukan `is_correct` di `question_options`. Untuk `short_answer`: referensi jawaban, opsional. Untuk `essay`: rubrik singkat, opsional. Null untuk `multiple_choice` dan `multiple_answer`. |
| grading_rubric | Rubrik detail untuk isian/esai, nullable |
| manual_explanation | Pembahasan manual, nullable |
| ai_explanation | Pembahasan AI, nullable |
| year | Tahun soal, nullable |
| points | Bobot nilai default |
| status | enum ContentStatus |
| created_by | FK users, nullable |
| created_at | Tanggal dibuat |
| updated_at | Tanggal update |

### 10.10 question_options

Digunakan untuk `multiple_choice`, `multiple_answer`, dan `true_false`. Tidak dibuat untuk `short_answer` dan `essay`.

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
| has_practice_mode | Boolean |
| has_quiz_mode | Boolean |
| quiz_duration_minutes | Durasi quiz, nullable |
| shuffle_questions | Boolean |
| shuffle_options | Boolean |
| allow_review_before_submit | Boolean |
| show_result_after_submit | Boolean |
| show_explanation_after_submit | Boolean |
| navigation_mode | enum NavigationMode |
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

**Catatan:** Pembahasan (`manual_explanation`, `ai_explanation`) tidak di-snapshot. Halaman review akan selalu menampilkan pembahasan terbaru dari tabel `questions`.

### 10.15 practice_answers

Menyimpan jawaban user untuk setiap soal dalam practice session.

| Field | Keterangan |
|---|---|
| id | Primary key |
| practice_session_id | FK practice_sessions |
| practice_session_question_id | FK practice_session_questions |
| question_type | enum QuestionType |
| selected_option_keys | JSON nullable. Digunakan untuk `multiple_choice` (satu nilai), `multiple_answer` (banyak nilai), dan `true_false` (satu nilai: **`"true"` atau `"false"` — selalu lowercase**). |
| answer_text | Jawaban teks, nullable. Digunakan untuk `short_answer` dan `essay`. |
| is_marked_for_review | Boolean |
| is_correct | Boolean nullable |
| score | Skor final jawaban, nullable |
| max_score | Skor maksimal, nullable |
| grading_status | enum AnswerGradingStatus |
| **grading_source** | **enum GradingSource, nullable. Diisi saat jawaban dinilai: `auto` (sistem), `manual` (admin), atau `ai` (AI grading).** |
| grading_feedback | Feedback grading terakhir yang aktif, nullable. Hanya menyimpan feedback terbaru; riwayat grading sebelumnya tidak dipertahankan. |
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
| navigation_mode | enum NavigationMode |
| enforce_end_time | Boolean. Hanya bermakna jika `ends_at` tidak null. Validasi publish mencegah `enforce_end_time = true` jika `ends_at` null. |
| wrong_answer_penalty | DECIMAL(5,2), default `0.00`. Nilai skor yang diberikan untuk setiap jawaban **salah** pada soal objektif. Berlaku untuk seluruh section kecuali section yang memiliki override. Nilai harus `≤ 0`. Contoh: `0` = tidak ada penalti, `-1.00` = kurangi 1 poin, `-0.25` = kurangi 0.25 poin. |
| status | enum ContentStatus |
| **published_at** | **Waktu pertama kali dipublish, nullable. Diisi saat status pertama berubah ke `published`; tidak berubah jika di-unpublish dan re-publish.** |
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
| **graded_at** | **Waktu semua penilaian dalam section ini selesai, nullable. Diisi saat semua jawaban subjektif section ini berstatus `graded` (tidak ada lagi yang `pending` atau `needs_review`). Jika section tidak memiliki jawaban subjektif, `graded_at` diisi saat scoring objektif selesai dijalankan (termasuk untuk section yang di-auto-submit dari `pending`). Null berarti section belum selesai di-scoring.** |
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

**Catatan:** Pembahasan (`manual_explanation`, `ai_explanation`) tidak di-snapshot. Halaman review akan selalu menampilkan pembahasan terbaru dari tabel `questions`.

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
| answer_text | Jawaban teks, nullable. Digunakan untuk `short_answer` dan `essay`. |
| is_marked_for_review | Boolean |
| is_correct | Boolean nullable |
| score | Skor final jawaban, nullable |
| max_score | Skor maksimal, nullable |
| grading_status | enum AnswerGradingStatus |
| **grading_source** | **enum GradingSource, nullable. Diisi saat jawaban dinilai: `auto` (sistem), `manual` (admin), atau `ai` (AI grading).** |
| grading_feedback | Feedback grading terakhir yang aktif, nullable. Hanya menyimpan feedback terbaru; riwayat grading sebelumnya tidak dipertahankan. |
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

- Token verifikasi email, reset password, dan ubah email disimpan dalam bentuk hash.
- Token hanya valid jika `used_at IS NULL` AND `invalidated_at IS NULL` AND `expires_at > NOW()`.
- Sebelum membuat token reset password baru, sistem mengisi `invalidated_at = NOW()` pada semua token reset password lama milik user yang sama yang masih valid (belum `used_at` dan belum `invalidated_at`).
- Sebelum membuat token verifikasi email baru (resend), sistem mengisi `invalidated_at = NOW()` pada semua token verifikasi email lama milik user yang sama yang masih valid. Resend dibatasi maksimal 3 kali per jam per user untuk mencegah abuse pengiriman email.
- Sebelum membuat token ubah email baru, sistem mengisi `invalidated_at = NOW()` pada semua token ubah email lama milik user yang sama yang masih valid.
- `used_at` diisi **hanya** ketika user benar-benar menggunakan token (klik link verifikasi, submit form reset password). Jangan gunakan `used_at` untuk invalidasi sistematis.
- Google login **tidak** boleh otomatis mengambil alih akun yang `google_id`-nya masih null. Cek dilakukan berdasarkan `google_id`, bukan keberadaan password.
- Linking Google hanya boleh dari halaman profil setelah user login. Email Google yang dihubungkan wajib sama dengan email akun Nalarin.id pada MVP.

#### Rate Limiting

| Endpoint | Batas |
|---|---|
| Login (email/password) | Maks 10 percobaan gagal per 15 menit per IP + email |
| Forgot password request | Maks 3 request per jam per email |
| Resend email verification | Maks 3 request per jam per user |
| AI generate soal | Maks 50 request per hari per admin |
| AI generate pembahasan | Maks 100 request per hari per admin |
| AI grading jawaban (practice + tryout gabungan) | Maks 200 request per hari per admin |

Nilai batas di atas adalah acuan awal dan dapat disesuaikan berdasarkan monitoring produksi.

### 13.2 Session Creation dan Monthly Usage

- Monthly usage dicek sebelum membuat session.
- Counter diincrement dalam transaction yang sama dengan pembuatan session.
- Period usage mengikuti `created_at` session dengan format bulan YYYY-MM-01.
- Session `cancelled` tetap dihitung dalam monthly usage, kecuali dibatalkan admin karena error sistem.
- Ketika user memilih "Mulai Baru" pada session yang masih `in_progress`, session lama di-cancel (tetap dihitung) dan session baru dibuat (counter diincrement kembali). Desain ini disengaja.

### 13.3 Practice Session Scoring

- **Kebijakan pembuatan baris jawaban:** Baris `practice_answers` **tidak** di-pre-create saat session dibuat. Baris dibuat pertama kali saat user menyimpan jawaban (autosave atau submit). Jika user tidak pernah menyentuh soal tertentu, tidak ada baris `practice_answers` untuk soal tersebut. Saat scoring dijalankan, sistem menentukan soal mana yang tidak memiliki baris jawaban dan memperlakukannya sebagai unanswered (skor 0, `is_correct = false`). `total_unanswered` dihitung sebagai `total_questions - jumlah baris practice_answers yang ada`.
- Jawaban objektif dinilai otomatis saat session di-submit.
- Saat session di-submit, sistem mengisi `is_correct`, `score`, `grading_status = not_required`, dan **`grading_source = auto`** untuk semua jawaban objektif (termasuk `true_false`).
- Penilaian `true_false` dilakukan dengan membandingkan langsung nilai `selected_option_keys` dengan `questions.correct_answer_text`. Keduanya selalu disimpan dalam lowercase (`"true"` atau `"false"`), sehingga tidak diperlukan konversi saat penilaian. Bukan dari `question_options.is_correct`.
- Jawaban kosong (unanswered) juga diisi `is_correct = false`, `score = 0`, `grading_status = not_required`, `grading_source = auto`.
- Multiple answer mengikuti `scoring_rule` pada soal:
  - `all_or_nothing`: skor penuh hanya jika semua opsi benar dipilih **dan** tidak ada opsi salah yang dipilih. Satu pun opsi salah dipilih atau satu pun opsi benar tidak dipilih → skor `0` (untuk practice); untuk tryout, skor menjadi `wrong_answer_penalty` section.
  - `partial`: skor proporsional. Formula: `max(floor, (benar_dipilih - salah_dipilih) / total_opsi_benar × points)`, dibulatkan ke bawah. Nilai `floor` adalah `0` untuk practice. Untuk tryout, `floor = wrong_answer_penalty` dari section session. Contoh practice: 3 opsi benar, pilih 2 benar + 1 salah → `max(0, (2−1)/3 × points)`. Contoh tryout berpenalti −1 (points=4): `max(−1, (2−1)/3 × 4) = max(−1, 1.33) = 1`.
- Jawaban subjektif: baris `practice_answers` dibuat saat user **pertama kali menyimpan** teks jawaban (autosave), dengan `grading_status = pending`, `is_correct = null`, `score = null`, `grading_source = null`. Jika user tidak pernah mengisi teks jawaban untuk soal subjektif tertentu, tidak ada baris yang dibuat; soal tersebut dianggap unanswered dengan skor 0.
- Setelah admin atau AI menilai jawaban subjektif, `grading_source` diisi sesuai penilai (`manual` atau `ai`).
- Jawaban berstatus `needs_review` dianggap belum selesai dan memblokir chain grading.
- Skor session dihitung ulang dan status berubah menjadi `graded` hanya setelah semua jawaban subjektif berstatus `graded` (tidak ada yang `pending` atau `needs_review`).

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
5. Jika tidak ada jawaban subjektif, status langsung berubah menjadi `graded`. Pada kondisi ini, `tryout_section_sessions.graded_at` untuk setiap section diisi dengan waktu scoring selesai. Section yang di-auto-submit dari `pending` (tidak ada jawaban sama sekali) juga mendapat `graded_at` diisi saat scoring dijalankan.
6. Jika ada jawaban subjektif, status menjadi `grading`. Nilai `total_score` pada saat ini hanya mencerminkan skor jawaban objektif. Setelah semua jawaban subjektif dalam satu section di-grade (tidak ada lagi yang `pending` atau `needs_review`), `tryout_section_sessions.graded_at` untuk section tersebut diisi. Setelah **semua** section memiliki `graded_at` terisi, `total_score`, `total_correct`, dan `tryout_section_sessions.score` **dihitung ulang** (menggabungkan skor objektif + subjektif yang sudah final), `tryout_sessions.graded_at` diisi, dan status berubah menjadi `graded`.

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
- Practice tidak boleh dipublish jika `has_practice_mode = false` dan `has_quiz_mode = false`. Minimal satu mode harus aktif.
- Practice tidak boleh dipublish jika `has_quiz_mode = true` tetapi `quiz_duration_minutes` kosong atau kurang dari/sama dengan 0.
- Practice tidak boleh dipublish jika ada soal dalam practice yang belum `published`, sudah `archived`, atau subject-nya tidak sesuai dengan subject practice.
- Tryout tidak boleh dipublish jika tidak punya soal.
- Tryout tidak boleh dipublish jika section kosong atau durasi section belum diisi.
- Tryout tidak boleh dipublish jika `enforce_end_time = true` tetapi `ends_at = null`.
- Soal yang sudah digunakan session tidak boleh diubah pada bagian konten, opsi, atau kunci jawaban. Gunakan `archived` dan buat soal baru jika perlu perubahan besar.
- Field `created_by` pada questions, practices, dan tryouts wajib diisi untuk konten yang dibuat melalui admin panel. Nullable hanya untuk data seed, migrasi, atau import sistem lama.
- Record `practice_questions` tidak boleh dihapus jika sudah direferensikan oleh `practice_session_questions`. Jika soal harus dikeluarkan dari practice, buat versi baru practice.
- Record `tryout_questions` tidak boleh dihapus jika sudah direferensikan oleh `tryout_session_questions`. Jika soal harus dikeluarkan dari section, buat versi baru tryout.
- `scoring_rule` wajib diisi (NOT NULL) untuk soal bertipe `multiple_answer`. Validasi ini diterapkan di level service layer dan import Excel.

---

## 14. Flow Utama

### 14.1 Flow Register dan Verifikasi Email

1. User register dengan nama, email, dan password.
2. Sistem membuat user Free secara default tanpa subscription berbayar.
3. Sistem membuat email verification token dan mengirim link verifikasi.
4. User login dalam mode terbatas sampai email terverifikasi.
5. Setelah token valid digunakan, `email_verified_at` diisi dan `used_at` pada token diisi.

### 14.2 Flow Resend Email Verification

1. User yang sudah login tapi belum terverifikasi membuka halaman profil atau banner verifikasi.
2. User memilih kirim ulang email verifikasi.
3. Sistem mengisi `invalidated_at = NOW()` pada semua token verifikasi lama milik user yang masih valid.
4. Sistem membuat token baru dan mengirim email verifikasi baru.
5. Endpoint ini memiliki rate limit maks 3 kali per jam per user untuk mencegah spam.

### 14.3 Flow Forgot Password

1. User memasukkan email di halaman forgot password.
2. Jika email terdaftar, sistem mengisi `invalidated_at = NOW()` pada semua token reset password lama milik user yang masih valid (belum `used_at` dan belum `invalidated_at`). Invalidasi dilakukan **sebelum** token baru dibuat.
3. Sistem membuat token reset password baru. Token asli dikirim ke email, token hash disimpan.
4. User membuka link reset password.
5. Sistem validasi token (cek `used_at IS NULL`, `invalidated_at IS NULL`, `expires_at > NOW()`).
6. User membuat password baru.
7. `used_at` pada token diisi.

### 14.4 Flow Google Login dan Linking

1. User memilih login Google.
2. Jika email belum ada di sistem, sistem membuat user baru dengan `email_verified_at` terisi.
3. Jika email sudah ada **dan `google_id` user masih null** (belum pernah dihubungkan ke Google), login Google **ditolak** dengan pesan untuk login menggunakan email/password terlebih dahulu, kemudian menghubungkan Google dari halaman profil.
4. Jika email sudah ada **dan `google_id` sudah terhubung** (tidak null), login Google diizinkan tanpa memandang ada-tidaknya password.
5. User yang sudah login dapat membuka profil dan memilih hubungkan Google.
6. Sistem hanya menghubungkan Google jika email dari Google OAuth sama dengan email akun Nalarin.id milik user yang sedang login. Jika berbeda, linking ditolak.
7. Setelah validasi email sesuai, `google_id` dihubungkan ke akun tersebut.

### 14.5 Flow Ubah Email

1. User login dan membuka halaman profil.
2. User memasukkan email baru.
3. Sistem mengisi `invalidated_at = NOW()` pada semua token ubah email lama yang masih valid.
4. Sistem membuat `email_change_token` dan mengirim verifikasi ke email baru.
5. Email utama belum berubah sampai token valid digunakan.
6. Setelah token valid, email user diperbarui, `used_at` token diisi, dan `email_verified_at` diisi ulang.

### 14.6 Flow Latihan / Quiz

1. User memilih exam type.
2. User memilih subject.
3. User memfilter practice berdasarkan topic.
4. User memilih practice.
5. User memilih Mode Latihan atau Mode Quiz.
6. Sistem mengecek akses dan limit.
7. Sistem membuat session dengan status awal `in_progress` dan snapshot soal.
8. User mengerjakan soal.
9. Jawaban dan `current_question_order` autosave.
10. Session selesai melalui submit atau auto submit.
11. Sistem menghitung skor dan mengisi `grading_source = auto` untuk jawaban objektif.
12. Jika ada jawaban subjektif, session masuk grading.
13. Setelah graded, progress diperbarui.

### 14.7 Flow Cancel Pending Payment

1. User membuka halaman profil atau halaman checkout dan melihat payment pending aktif.
2. User memilih batalkan payment.
3. Sistem mengupdate status payment menjadi `cancelled` di database.
4. Jika gateway adalah Midtrans, sistem memanggil Midtrans Cancel API untuk membatalkan transaksi di sisi Midtrans.
5. Jika Midtrans API gagal dipanggil (timeout/error), payment tetap ditandai `cancelled` di sisi kita. Midtrans akan expire sendiri sesuai waktu yang ditetapkan. Jika kemudian Midtrans mengirim webhook sukses untuk payment yang sudah `cancelled`, webhook tersebut **diabaikan (no-op)** dan tidak membuat subscription baru (lihat Section 13.7).
6. Setelah cancelled, user dapat membuat payment baru untuk plan yang sama atau berbeda.

### 14.8 Flow Tryout

1. User membuka daftar tryout.
2. User memilih tryout aktif.
3. Sistem mengecek akses dan limit.
4. Sistem memastikan user belum punya session untuk tryout tersebut.
5. Sistem membuat tryout session (status `in_progress`), section sessions (semua status `pending`), dan snapshot soal.
6. User mengerjakan section sesuai timer.
7. Section selesai melalui submit atau auto submit.
8. Setelah semua section selesai, session submit.
9. Sistem menilai jawaban objektif, mengisi `grading_source = auto`.
10. Jawaban subjektif masuk grading jika ada.
11. Setelah semua penilaian selesai, session menjadi graded.
12. Ranking tersedia melalui query jika plan dan setting mengizinkan.
13. Progress diperbarui.

### 14.9 Flow Manual Payment dan Admin Approval

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
- Auth email/password via Server Actions.
- Verifikasi email dan Resend/React Email untuk email transaksional.
- Forgot/reset password (dengan `invalidated_at` pada token tables).
- Login Google via OAuth 2.0 manual (no auto-link).
- Profile dasar (termasuk field `school_class`).
- Admin dashboard awal dengan layout shadcn/ui.

### Phase 2 — Content dan Bank Soal

- Exam types seed (via Drizzle seed).
- Subjects dan topics.
- CRUD questions (termasuk penanganan true_false, multiple_answer dengan scoring_rule wajib).
- Question options.
- Import Excel via **SheetJS** (`xlsx`).
- Generate soal dan pembahasan AI (via Route Handler ke AI provider).
- Practices dan practice questions (slug scoped per exam_type_id, URL `/latihan/{exam_type_slug}/{practice_slug}`, field published_at).

### Phase 3 — Practice dan Quiz

- Practice sessions (dengan field `current_question_order`, status awal `in_progress`).
- Snapshot soal.
- Autosave (jawaban + posisi soal).
- Mode Latihan.
- Mode Quiz.
- Resume session.
- Review jawaban.
- Pembahasan.
- Grading jawaban subjektif (dengan field `grading_source`).

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
- Persentase user yang memverifikasi email.
- Jumlah practice session dibuat.
- Jumlah quiz session dibuat.
- Jumlah tryout session dibuat.
- Completion rate latihan dan tryout.
- Conversion Free ke Pro/Max.
- Revenue bulanan.
- Jumlah artikel blog terindeks.
- Akurasi import soal.
- Jumlah soal dan pembahasan yang berhasil di-generate AI.
- Distribusi `grading_source` (manual vs AI) untuk monitoring kualitas grading.

---

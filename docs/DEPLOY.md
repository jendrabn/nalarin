# Deployment Guide

Panduan ini untuk deploy Nalarin di Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS dengan model self-hosted Node.js server di belakang Nginx.

## Overview

Nalarin adalah aplikasi web berbasis Next.js yang memakai MySQL sebagai database utama, session cookie berbasis `iron-session`, dan berbagai integrasi produksi seperti Google OAuth, email provider, Midtrans, serta AI provider.

Untuk production, aplikasi ini sebaiknya tidak diekspos langsung dari `next start`. Gunakan Nginx sebagai reverse proxy, lalu sertakan SSL dengan Certbot.

## Tech Stack

- Next.js 16.2.5
- React 19.2.4
- TypeScript
- Drizzle ORM + migration SQL di folder `drizzle/`
- MySQL 8
- `mysql2`
- `iron-session`
- `bcrypt`
- Tailwind CSS v4
- shadcn/ui dan Radix UI
- Nginx sebagai reverse proxy
- Certbot untuk SSL
- Node.js 22 LTS disarankan untuk production

## Prerequisites

- Server Ubuntu 22.04 atau 24.04
- Domain aktif yang mengarah ke IP server
- A record untuk domain utama, dan optional `www`
- Akses `sudo`
- Port 80 dan 443 terbuka
- Kredensial MySQL
- API key untuk layanan eksternal yang dipakai aplikasi

## Catatan Penting

- File `src/app/layout.tsx`, `src/app/robots.ts`, dan `src/app/sitemap.ts` memakai domain `https://nalarin.id`.
- Jika domain production Anda berbeda, sesuaikan `APP_URL`, `NEXT_PUBLIC_APP_URL`, dan `GOOGLE_REDIRECT_URI` di `.env`, lalu update juga metadata domain di source code.
- App ini memakai upload lokal di `public/uploads/`, jadi folder itu harus ada dan writable oleh user aplikasi.
- Untuk production, jangan jalankan `next dev`. Pakai `npm run build` lalu `npm run start`.

## 1. Siapkan Server

Update sistem dan pasang paket dasar:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx mysql-server build-essential python3 curl ca-certificates
```

Install Node.js 22 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Amankan instalasi MySQL:

```bash
sudo mysql_secure_installation
```

Jika memakai UFW, buka port yang dibutuhkan:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 2. Buat User Deployment

Jalankan aplikasi dengan user non-root. Pada VPS ini username yang dipakai adalah `deploy`.

```bash
sudo mkdir -p /srv/nalarin
sudo chown -R deploy:deploy /srv/nalarin
```

Masuk sebagai user deployment:

```bash
sudo -iu deploy
```

## 3. Clone Repository

Clone repo ke server:

```bash
cd /srv
git clone <REPO_URL> nalarin
cd /srv/nalarin
npm ci
mkdir -p public/uploads
```

Jika Anda memakai SSH key, gunakan URL SSH repo. Jika tidak, gunakan HTTPS.

## 4. Setup Database MySQL

Buat database dan user khusus aplikasi:

```bash
sudo mysql
```

Lalu jalankan di prompt MySQL:

```sql
CREATE DATABASE nalarin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nalarin'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_YANG_KUAT';
GRANT ALL PRIVILEGES ON nalarin.* TO 'nalarin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Jika database berjalan di host lain, sesuaikan host di `DATABASE_URL`.

### Jalankan migration

Repo ini sudah menyimpan SQL migration di folder `drizzle/`. Jalankan berurutan:

```bash
cat drizzle/*.sql | mysql -u nalarin -p nalarin
```

Perintah di atas akan meminta password MySQL user `nalarin`.

### Seed data awal

Setelah migration selesai, jalankan seed:

```bash
npm run db:seed
```

Seed ini mengisi data taxonomy dasar, kategori blog, dan akun contoh.

## 5. Siapkan File Environment

Salin seluruh isi `./.env.example` ke `.env` di root project, lalu ubah nilai production yang sensitif. Jangan menghapus variabel lain karena schema env di repo ini cukup ketat.

Contoh nilai yang biasanya perlu Anda sesuaikan:

```env
NODE_ENV=production
APP_NAME=Nalarin
APP_URL=https://nalarin.id
NEXT_PUBLIC_APP_URL=https://nalarin.id
NEXT_PUBLIC_APP_NAME=Nalarin

DATABASE_URL=mysql://nalarin:GANTI_PASSWORD_YANG_KUAT@127.0.0.1:3306/nalarin

SESSION_PASSWORD=isi-dengan-string-minimal-32-karakter
SESSION_COOKIE_NAME=nalarin_session
SESSION_TTL_DAYS=7
BCRYPT_ROUNDS=10

GOOGLE_CLIENT_ID=isi-dari-google-cloud
GOOGLE_CLIENT_SECRET=isi-dari-google-cloud
GOOGLE_REDIRECT_URI=https://nalarin.id/api/auth/google/callback

EMAIL_PROVIDER=resend
MAIL_FROM="Nalarin <no-reply@nalarin.id>"
RESEND_API_KEY=isi-jika-email-provider-resend
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

PAYMENT_GATEWAY_ENABLED=true
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=isi-jika-midtrans-aktif
MIDTRANS_CLIENT_KEY=isi-jika-midtrans-aktif
MIDTRANS_MERCHANT_ID=isi-jika-midtrans-aktif

AI_PROVIDER=openai-compatible
AI_API_KEY=isi-key-ai
AI_BASE_URL=
AI_MODEL_QUESTION_GENERATION=gpt-4.1-mini
AI_MODEL_EXPLANATION_GENERATION=gpt-4.1-mini
AI_MODEL_GRADING=gpt-4.1-mini

FILE_STORAGE_DRIVER=local
FILE_STORAGE_BASE_URL=https://nalarin.id/uploads
FILE_STORAGE_PUBLIC_DIR=public/uploads

CRON_SECRET=isi-random-string-minimal-16-karakter
PRACTICE_ABANDONED_HOURS=24
TRYOUT_ABANDONED_HOURS=72
SUBSCRIPTION_EXPIRY_CRON_ENABLED=true
```

### Catatan env

- `GOOGLE_REDIRECT_URI` harus sama persis dengan `APP_URL + /api/auth/google/callback`.
- Jika `EMAIL_PROVIDER=resend`, maka `RESEND_API_KEY` wajib diisi.
- Jika `EMAIL_PROVIDER=smtp`, maka `SMTP_HOST`, `SMTP_USER`, dan `SMTP_PASSWORD` wajib diisi.
- Jika `PAYMENT_GATEWAY_ENABLED=true`, maka semua `MIDTRANS_*` wajib diisi.
- Jika `PAYMENT_GATEWAY_ENABLED=false`, maka field manual payment seperti `MANUAL_PAYMENT_WHATSAPP_NUMBER` dan nomor e-wallet harus diisi.

## 6. Build Production

Setelah `.env` siap dan database sudah terisi, build aplikasi:

```bash
npm run build
```

Jika build sukses, jalankan test start lokal terlebih dahulu:

```bash
npm run start
```

Buka sementara ke `http://SERVER_IP:3000` atau lewat SSH tunnel untuk memastikan aplikasi naik.
Setelah test selesai, hentikan proses tersebut sebelum PM2 diaktifkan.

## 7. Jalankan Dengan PM2

Install PM2 sebagai user `deploy`:

```bash
sudo npm install -g pm2
```

Buat file `ecosystem.config.cjs` di root project:

```js
module.exports = {
  apps: [
    {
      name: "nalarin",
      script: "npm",
      args: "run start -- --port 3000",
      cwd: "/srv/nalarin",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

Jalankan aplikasi:

```bash
cd /srv/nalarin
pm2 start ecosystem.config.cjs
pm2 status
```

Simpan proses agar otomatis kembali setelah reboot:

```bash
pm2 startup
```

PM2 akan menampilkan command tambahan untuk startup systemd. Jalankan command tersebut, yang umumnya berbentuk:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

Setelah itu, simpan lagi:

```bash
pm2 save
```

Untuk melihat log:

```bash
pm2 logs nalarin
```

Perintah operasional yang umum:

```bash
pm2 restart nalarin
pm2 stop nalarin
pm2 delete nalarin
```

## 8. Konfigurasi Nginx

Buat file site baru:

```bash
sudo tee /etc/nginx/sites-available/nalarin > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name nalarin.id www.nalarin.id;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 60s;
    }
}
EOF
```

Aktifkan site dan test config:

```bash
sudo ln -s /etc/nginx/sites-available/nalarin /etc/nginx/sites-enabled/nalarin
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Pasang SSL dengan Certbot

Install Certbot:

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

Request sertifikat:

```bash
sudo certbot --nginx -d nalarin.id -d www.nalarin.id
```

Jika Anda hanya memakai satu domain, cukup pakai `-d nalarin.id`.

Verifikasi renewal:

```bash
sudo certbot renew --dry-run
```

Jika Anda mengubah `.env` setelah SSL aktif, restart aplikasi:

```bash
pm2 restart nalarin
```

## 10. Final Check

Setelah SSL aktif, pastikan:

```bash
curl -I https://nalarin.id
sudo systemctl status nginx
pm2 status
```

Checklist cepat:

- Homepage tampil
- Login dan register berjalan
- Redirect admin ke `/admin` bekerja
- Upload file berfungsi
- Google OAuth callback sesuai domain production
- Sitemap dan robots sudah memakai domain yang benar

## Troubleshooting Singkat

- Jika login gagal setelah pindah ke production, cek `APP_URL`, `NEXT_PUBLIC_APP_URL`, dan `GOOGLE_REDIRECT_URI`.
- Jika upload gagal, pastikan `public/uploads/` ada dan writable.
- Jika Nginx menolak request besar, naikkan `client_max_body_size`.
- Jika aplikasi gagal start, cek `pm2 logs nalarin`.
- Jika domain berbeda dari `nalarin.id`, update metadata domain di `src/app/layout.tsx`, `src/app/robots.ts`, dan `src/app/sitemap.ts`.

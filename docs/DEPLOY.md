# Deployment Guide

Panduan ini menjelaskan deployment Nalarin ke VPS Ubuntu Server 22.04 dengan Bun, PM2, Nginx, dan GitHub Actions. First deploy tetap dilakukan manual karena file `.env` harus dibuat langsung di VPS dan tidak disimpan di GitHub.

## Ringkasan

- OS: Ubuntu Server 22.04 LTS
- App runtime: Bun
- Process manager: PM2
- Reverse proxy: Nginx
- SSL: Certbot
- Database: MySQL
- User VPS aplikasi: `deploy`
- Folder aplikasi: `/var/www/nalarin`
- Branch deploy: `main`
- Port aplikasi default: `3001`, bisa diubah lewat `APP_PORT` di `.env`

Workflow GitHub Actions berada di `.github/workflows/deploy.yml`. Workflow akan SSH ke VPS, masuk ke `/var/www/nalarin`, mengambil perubahan terbaru dari `origin/main`, menjalankan `bun install`, `bun run build`, lalu reload PM2.

## 1. Prasyarat

Pastikan sudah tersedia:

- VPS Ubuntu Server 22.04 LTS
- Domain sudah mengarah ke IP VPS
- Akses root atau user sudo ke VPS
- Port `22`, `80`, dan `443` terbuka
- Repository GitHub sudah berisi workflow deploy
- File `.env.example` tersedia di repository
- Kredensial MySQL dan API key production siap diisi manual ke `.env`

## 2. Install Paket Dasar

Login ke VPS sebagai root atau user sudo, lalu jalankan:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx mysql-server build-essential python3 curl ca-certificates unzip
```

Jika memakai UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Amankan MySQL:

```bash
sudo mysql_secure_installation
```

## 3. Buat User Deploy

Gunakan user non-root untuk menjalankan aplikasi. Contoh username: `deploy`.

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

Buat folder aplikasi dan berikan ownership ke user `deploy`:

```bash
sudo mkdir -p /var/www/nalarin
sudo chown -R deploy:deploy /var/www/nalarin
sudo chmod 755 /var/www
sudo chmod 755 /var/www/nalarin
```

Login sebagai user `deploy`:

```bash
sudo -iu deploy
```

## 4. Install Bun Sebagai User Deploy

Bun harus diinstall oleh user yang menjalankan aplikasi, yaitu `deploy`.

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
```

Pastikan Bun ada di path berikut:

```bash
which bun
```

Umumnya hasilnya:

```text
/home/deploy/.bun/bin/bun
```

## 5. Install PM2 Sebagai User Deploy

Workflow bisa menginstall PM2 otomatis jika belum ada, tetapi untuk first deploy lebih baik install manual:

```bash
bun add -g pm2
pm2 -v
```

Tambahkan PM2 startup agar proses kembali hidup setelah VPS reboot:

```bash
pm2 startup
```

PM2 akan menampilkan perintah `sudo env PATH=... pm2 startup ...`. Jalankan perintah tersebut persis seperti output PM2.

## 6. Setup SSH untuk GitHub Actions ke VPS

Bagian ini membuat `VPS_SSH_KEY`, yaitu private key yang disimpan di GitHub Actions agar runner bisa SSH ke VPS sebagai user `deploy`.

Jalankan di komputer lokal, bukan di VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions-nalarin-deploy" -f ./nalarin-gh-actions-vps
```

Saat diminta passphrase, tekan `Enter` dua kali agar passphrase kosong. GitHub Actions workflow ini tidak menyiapkan SSH agent untuk private key yang memakai passphrase.

Perintah ini membuat dua file:

- `nalarin-gh-actions-vps`: private key, isi file ini menjadi GitHub Secret `VPS_SSH_KEY`
- `nalarin-gh-actions-vps.pub`: public key, isi file ini dipasang ke VPS

Copy public key ke VPS:

```bash
ssh-copy-id -i ./nalarin-gh-actions-vps.pub deploy@YOUR_VPS_IP
```

Jika `ssh-copy-id` tidak tersedia, pasang manual:

```bash
ssh deploy@YOUR_VPS_IP
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Paste isi `nalarin-gh-actions-vps.pub` ke `authorized_keys`, satu key per baris.

Test SSH dari komputer lokal:

```bash
ssh -i ./nalarin-gh-actions-vps deploy@YOUR_VPS_IP
```

Jika berhasil login tanpa password user, key sudah benar.

## 7. Setup GitHub Secrets dan Variables

Buka GitHub repository, lalu masuk ke:

```text
Settings -> Secrets and variables -> Actions
```

Tambahkan repository secrets:

- `VPS_HOST`: IP atau hostname VPS, contoh `203.0.113.10`
- `VPS_USER`: `deploy`
- `VPS_PORT`: `22`, opsional karena workflow default ke `22`
- `VPS_SSH_KEY`: isi private key dari file `nalarin-gh-actions-vps`

Cara mengambil isi private key:

```bash
cat ./nalarin-gh-actions-vps
```

Jika memakai PowerShell di Windows:

```powershell
Get-Content -Raw .\nalarin-gh-actions-vps
```

Copy seluruh isi, termasuk:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Tambahkan repository variable jika path deploy berbeda:

- `DEPLOY_PATH`: `/var/www/nalarin`

Jika tidak dibuat, workflow memakai default `/var/www/nalarin`.

## 8. Setup SSH dari VPS ke GitHub Repository

Workflow menjalankan `git fetch origin main` dari VPS. Artinya user `deploy` di VPS harus punya akses pull ke repository.

Gunakan key yang berbeda dari `VPS_SSH_KEY`. `VPS_SSH_KEY` hanya untuk GitHub Actions login ke VPS, sedangkan key di bagian ini hanya untuk VPS pull repository dari GitHub.

Login sebagai `deploy` di VPS:

```bash
sudo -iu deploy
```

Buat SSH key khusus untuk pull repository:

```bash
ssh-keygen -t ed25519 -C "deploy@nalarin-vps" -f ~/.ssh/github_nalarin
chmod 700 ~/.ssh
chmod 600 ~/.ssh/github_nalarin
chmod 644 ~/.ssh/github_nalarin.pub
```

Tampilkan public key:

```bash
cat ~/.ssh/github_nalarin.pub
```

Tambahkan public key tersebut ke GitHub repository:

```text
Repository -> Settings -> Deploy keys -> Add deploy key
```

Gunakan:

- Title: `nalarin-vps-deploy`
- Key: isi dari `~/.ssh/github_nalarin.pub`
- Allow write access: jangan dicentang

Buat SSH config untuk GitHub:

```bash
nano ~/.ssh/config
```

Isi:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile /home/deploy/.ssh/github_nalarin
  IdentitiesOnly yes
```

Set permission:

```bash
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

Jika muncul pesan bahwa GitHub berhasil mengenali key, akses pull sudah siap.

## 9. Clone Repository untuk First Deploy

Masih sebagai user `deploy`:

```bash
cd /var/www
git clone git@github.com:OWNER/REPOSITORY.git nalarin
cd /var/www/nalarin
```

Ganti `OWNER/REPOSITORY` sesuai repository Nalarin.

Pastikan remote memakai SSH:

```bash
git remote -v
```

Jika masih HTTPS, ubah:

```bash
git remote set-url origin git@github.com:OWNER/REPOSITORY.git
```

Pastikan folder tetap dimiliki user `deploy`:

```bash
sudo chown -R deploy:deploy /var/www/nalarin
find /var/www/nalarin -type d -exec chmod 755 {} \;
find /var/www/nalarin -type f -exec chmod 644 {} \;
```

## 10. Permission Folder Upload dan File Environment

Folder upload lokal harus bisa ditulis oleh aplikasi:

```bash
cd /var/www/nalarin
mkdir -p public/uploads
chmod 755 public
chmod 775 public/uploads
chown -R deploy:deploy public/uploads
```

Buat `.env` manual dari `.env.example`:

```bash
cp .env.example .env
nano .env
```

Set permission `.env` agar hanya user `deploy` yang bisa membaca dan menulis:

```bash
chown deploy:deploy .env
chmod 600 .env
```

Jangan commit `.env`. Workflow GitHub Actions tidak membuat, mengubah, atau mengirim nilai `.env`.

## 11. Isi Environment Production

Minimal nilai penting yang perlu dicek:

```env
NODE_ENV=production
APP_NAME=Nalarin
APP_URL=https://nalarin.id
NEXT_PUBLIC_APP_URL=https://nalarin.id
NEXT_PUBLIC_APP_NAME=Nalarin
APP_PORT=3001

DATABASE_URL=mysql://nalarin:CHANGE_TO_A_STRONG_PASSWORD@127.0.0.1:3306/nalarin

SESSION_PASSWORD=use-a-string-with-at-least-32-characters
SESSION_COOKIE_NAME=nalarin_session
SESSION_TTL_DAYS=7
BCRYPT_ROUNDS=10

GOOGLE_CLIENT_ID=from-google-cloud
GOOGLE_CLIENT_SECRET=from-google-cloud
GOOGLE_REDIRECT_URI=https://nalarin.id/api/auth/google/callback

EMAIL_PROVIDER=resend
MAIL_FROM="Nalarin <no-reply@nalarin.id>"
RESEND_API_KEY=required-if-email-provider-is-resend
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

PAYMENT_GATEWAY_ENABLED=true
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=required-if-midtrans-is-enabled
MIDTRANS_CLIENT_KEY=required-if-midtrans-is-enabled
MIDTRANS_MERCHANT_ID=required-if-midtrans-is-enabled

AI_PROVIDER=openai-compatible
AI_API_KEY=your-ai-api-key
AI_BASE_URL=
AI_MODEL_QUESTION_GENERATION=gpt-4.1-mini
AI_MODEL_EXPLANATION_GENERATION=gpt-4.1-mini
AI_MODEL_GRADING=gpt-4.1-mini

FILE_STORAGE_DRIVER=local
FILE_STORAGE_BASE_URL=https://nalarin.id/uploads
FILE_STORAGE_PUBLIC_DIR=public/uploads

CRON_SECRET=use-a-random-string-with-at-least-16-characters
PRACTICE_ABANDONED_HOURS=24
TRYOUT_ABANDONED_HOURS=72
SUBSCRIPTION_EXPIRY_CRON_ENABLED=true
```

Catatan environment:

- `GOOGLE_REDIRECT_URI` harus sama persis dengan callback yang didaftarkan di Google Cloud.
- Semua variable dengan prefix `NEXT_PUBLIC_` dibaca saat `bun run build`, jadi nilainya harus benar sebelum build production.
- `.env` harus berada di root project `/var/www/nalarin/.env`, bukan di folder `src`.
- Jika domain bukan `nalarin.id`, cek juga metadata domain di source code.

## 12. Setup Database MySQL

Masuk ke MySQL sebagai root:

```bash
sudo mysql
```

Buat database dan user aplikasi:

```sql
CREATE DATABASE nalarin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nalarin'@'localhost' IDENTIFIED BY 'CHANGE_TO_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON nalarin.* TO 'nalarin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Jalankan migration SQL:

```bash
cd /var/www/nalarin
cat drizzle/*.sql | mysql -u nalarin -p nalarin
```

Seed data awal:

```bash
bun run db:seed
```

Untuk deploy berikutnya, jangan menjalankan semua file migration lama dua kali. Jalankan hanya migration baru sesuai prosedur tim.

## 13. Build dan First Start Manual

Install dependency dan build:

```bash
cd /var/www/nalarin
bun install
bun run build
```

Smoke test langsung:

```bash
bun run start -- --port 3001
```

Test dari VPS:

```bash
curl -I http://127.0.0.1:3001
```

Jika aplikasi berhasil start, hentikan dengan `Ctrl+C`.

Start dengan PM2:

```bash
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 status nalarin
```

Lihat log:

```bash
pm2 logs nalarin
```

Command operasional PM2:

```bash
pm2 restart nalarin --update-env
pm2 stop nalarin
pm2 status nalarin
pm2 monit
```

## 14. Configure Nginx

Buat site Nginx:

```bash
sudo nano /etc/nginx/sites-available/nalarin
```

Isi:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name nalarin.id www.nalarin.id;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
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
```

Aktifkan site:

```bash
sudo ln -sf /etc/nginx/sites-available/nalarin /etc/nginx/sites-enabled/nalarin
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 15. Install SSL dengan Certbot

Install Certbot:

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

Request SSL:

```bash
sudo certbot --nginx -d nalarin.id -d www.nalarin.id
```

Jika hanya memakai domain utama:

```bash
sudo certbot --nginx -d nalarin.id
```

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

## 16. Auto Deploy dari GitHub Actions

Setelah first deploy manual selesai, auto deploy berjalan saat ada push ke branch `main`.

Workflow akan:

```bash
cd /var/www/nalarin
git fetch origin main
git reset --hard origin/main
bun install
bun run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 status nalarin
```

Karena workflow memakai `git reset --hard origin/main`, perubahan manual pada file yang dilacak Git di VPS akan ditimpa. File `.env` aman karena tidak dilacak Git, selama tetap ada di `/var/www/nalarin/.env`.

Workflow akan gagal jika:

- `/var/www/nalarin/.git` belum ada
- `/var/www/nalarin/.env` belum ada
- user `deploy` tidak bisa pull repository
- permission folder membuat build atau upload gagal
- Bun build gagal

## 17. Checklist Permission

Jalankan ini untuk audit permission dasar:

```bash
namei -l /var/www/nalarin
ls -ld /var/www /var/www/nalarin /var/www/nalarin/public /var/www/nalarin/public/uploads
ls -l /var/www/nalarin/.env
ls -ld /home/deploy/.ssh
ls -l /home/deploy/.ssh/authorized_keys /home/deploy/.ssh/config /home/deploy/.ssh/github_nalarin
```

Nilai yang diharapkan:

```text
/var/www                  root:root      755
/var/www/nalarin          deploy:deploy  755
/var/www/nalarin/.env     deploy:deploy  600
/var/www/nalarin/public   deploy:deploy  755
/var/www/nalarin/public/uploads deploy:deploy 775
/home/deploy/.ssh         deploy:deploy  700
/home/deploy/.ssh/authorized_keys deploy:deploy 600
/home/deploy/.ssh/config  deploy:deploy  600
/home/deploy/.ssh/github_nalarin deploy:deploy 600
```

Jika perlu memperbaiki:

```bash
sudo chown -R deploy:deploy /var/www/nalarin
sudo chmod 755 /var/www /var/www/nalarin
sudo chmod 600 /var/www/nalarin/.env
sudo chmod 755 /var/www/nalarin/public
sudo chmod 775 /var/www/nalarin/public/uploads
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/config
sudo chmod 600 /home/deploy/.ssh/github_nalarin
```

## 18. Final Check

Setelah SSL dan PM2 aktif:

```bash
curl -I https://nalarin.id
pm2 status nalarin
pm2 logs nalarin --lines 50
sudo systemctl status nginx
sudo nginx -t
```

Cek aplikasi:

- Homepage bisa diakses
- Login dan register berjalan
- Admin redirect ke `/admin` berjalan
- Upload file berjalan
- Google OAuth callback sesuai domain production
- Sitemap dan robots memakai domain production
- Log PM2 tidak berisi error berulang

## Troubleshooting

- Jika GitHub Actions gagal SSH, cek `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`, dan isi `/home/deploy/.ssh/authorized_keys`.
- Jika `git fetch` gagal, cek deploy key repository dari VPS: `ssh -T git@github.com`.
- Jika workflow gagal karena `.env`, buat `/var/www/nalarin/.env` manual dan set permission `chmod 600 .env`.
- Jika upload gagal, cek ownership dan permission `public/uploads`.
- Jika domain tidak terbuka, cek `sudo nginx -t`, DNS, firewall, dan Certbot.
- Jika aplikasi tidak start, cek `pm2 logs nalarin`.
- Jika perubahan `.env` tidak terbaca, jalankan `pm2 restart nalarin --update-env`.
- Jika build gagal, jalankan `bun run build` manual di VPS sebagai user `deploy` untuk melihat error lengkap.

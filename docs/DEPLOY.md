# Deployment Guide

This guide explains how to deploy Nalarin on an Ubuntu 22.04 LTS VPS with a self-hosted Next.js server behind Nginx. You can choose either Node.js/npm or Bun as the runtime.

## Overview

Nalarin is a Next.js web application that uses MySQL as the primary database, `iron-session` based session cookies, and production integrations such as Google OAuth, an email provider, Midtrans, and an AI provider.

For production, do not expose `next start` directly to the internet. Run the application on localhost, put Nginx in front of it as a reverse proxy, and enable SSL with Certbot.

## Tech Stack

- Next.js 16.2.5
- React 19.2.4
- TypeScript
- Drizzle ORM + SQL migrations in the `drizzle/` folder
- MySQL 8
- `mysql2`
- `iron-session`
- `bcrypt`
- Tailwind CSS v4
- shadcn/ui and Radix UI
- Nginx as the reverse proxy
- Certbot for SSL
- Production runtime: choose Node.js 22 LTS/npm or Bun

## Runtime Options

Choose one runtime and use it consistently on the server.

### Option A: Node.js/npm

This is the default option because the repo includes `package-lock.json`.

Use these commands for install, seed, build, and start:

```bash
npm ci
npm run db:seed
npm run build
npm run start -- --port 3001
```

### Option B: Bun

Bun can run the same scripts from `package.json`. Because this repo still has `package-lock.json`, validate `bun install`, `bun run build`, and the smoke test before switching the production service to Bun.

Use these commands for install, seed, build, and start:

```bash
bun install
bun run db:seed
bun run build
bun run start -- --port 3001
```

If a native dependency fails during install or build with Bun, use Node.js/npm for production.

## Prerequisites

- Ubuntu 22.04 LTS VPS
- Active domain pointing to the server IP
- A record for the main domain, and optionally `www`
- User access with `sudo`
- Open ports 80 and 443
- MySQL credentials
- API keys for the external services used by the application

## Important Notes

- `src/app/layout.tsx`, `src/app/robots.ts`, and `src/app/sitemap.ts` use the `https://nalarin.id` domain.
- If the production domain is different, update `APP_URL`, `NEXT_PUBLIC_APP_URL`, and `GOOGLE_REDIRECT_URI` in `.env`, then update the metadata domain in the source code as well.
- This app uses local uploads in `public/uploads/`, so the folder must exist and be writable by the application user.
- Do not run `next dev` in production. Build the app first, then run the `start` script.
- This guide assumes a single application instance. If you later run multiple instances or multiple servers, configure shared cache and a deployment identifier according to your Next.js self-hosting needs.

## 1. Prepare the Server

Update the system and install base packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx mysql-server build-essential python3 curl ca-certificates unzip
```

Secure the MySQL installation:

```bash
sudo mysql_secure_installation
```

If you use UFW, open the required ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 2. Install the Runtime

Choose one option.

### Option A: Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Option B: Install Bun

Bun must be installed as the user that runs the application. If you are not logged in as `deploy` yet, skip this command for now and run it after `sudo -iu deploy` in the next step.

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
```

## 3. Create a Deployment User

Run the application with a non-root user. This guide uses `deploy` as the example username.

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /var/www/nalarin
sudo chown -R deploy:deploy /var/www/nalarin
```

Log in as the deployment user:

```bash
sudo -iu deploy
```

If you chose Bun and have not installed it yet, install it now as `deploy`:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
```

## 4. Clone the Repository and Install Dependencies

Clone the repository to the server:

```bash
cd /var/www
git clone <REPO_URL> nalarin
cd /var/www/nalarin
mkdir -p public/uploads
```

Use the SSH repository URL if you have an SSH key configured. Otherwise, use HTTPS.

Install dependencies according to the runtime:

Node.js/npm:

```bash
npm ci
```

Bun:

```bash
bun install
```

## 5. Set Up MySQL

Create a dedicated database and application user:

```bash
sudo mysql
```

Run this in the MySQL prompt:

```sql
CREATE DATABASE nalarin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nalarin'@'localhost' IDENTIFIED BY 'CHANGE_TO_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON nalarin.* TO 'nalarin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

If the database runs on another host, adjust the host in `DATABASE_URL`.

### Run Migrations

This repo stores SQL migrations in the `drizzle/` folder. Run them in order:

```bash
cat drizzle/*.sql | mysql -u nalarin -p nalarin
```

The command above prompts for the MySQL password for the `nalarin` user.

### Seed Initial Data

After migrations finish, run the seed command according to the runtime:

Node.js/npm:

```bash
npm run db:seed
```

Bun:

```bash
bun run db:seed
```

The seed command inserts the base taxonomy data, blog categories, and example accounts.

## 6. Prepare the Environment File

Copy all content from `./.env.example` to `.env` in the project root, then update the sensitive production values. Do not remove other variables because this repo has strict environment validation.

```bash
cp .env.example .env
nano .env
```

Example values that usually need to be adjusted:

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

### Environment Notes

- `GOOGLE_REDIRECT_URI` must exactly match `APP_URL + /api/auth/google/callback`.
- If `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` is required.
- If `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASSWORD` are required.
- If `PAYMENT_GATEWAY_ENABLED=true`, all `MIDTRANS_*` values are required.
- If `PAYMENT_GATEWAY_ENABLED=false`, manual payment fields such as `MANUAL_PAYMENT_WHATSAPP_NUMBER` and e-wallet numbers must be set.

## 7. Build Production and Smoke Test

Make sure `.env` is ready and the database has been migrated and seeded.

Node.js/npm:

```bash
npm run build
npm run start -- --port 3001
```

Bun:

```bash
bun run build
bun run start -- --port 3001
```

Temporarily open `http://SERVER_IP:3001` or use an SSH tunnel to confirm the application starts. After the smoke test, stop the process with `Ctrl+C` before creating the production service.

## 8. Run the Application as a Service

Use `systemd` so the application starts automatically after reboot. Create the service file for the runtime you chose.

### Option A: Node.js/npm Service

Create the service file:

```bash
sudo tee /etc/systemd/system/nalarin.service > /dev/null <<'EOF'
[Unit]
Description=Nalarin Next.js App
After=network.target mysql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/var/www/nalarin
Environment=NODE_ENV=production
Environment=APP_PORT=3001
ExecStart=/usr/bin/npm run start -- --port 3001
Restart=always
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
```

### Option B: Bun Service

Confirm the Bun path:

```bash
which bun
```

If the result is `/home/deploy/.bun/bin/bun`, create this service file:

```bash
sudo tee /etc/systemd/system/nalarin.service > /dev/null <<'EOF'
[Unit]
Description=Nalarin Next.js App
After=network.target mysql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/var/www/nalarin
Environment=NODE_ENV=production
Environment=APP_PORT=3001
Environment=PATH=/home/deploy/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/home/deploy/.bun/bin/bun run start -- --port 3001
Restart=always
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
```

If `which bun` returns a different path, adjust `Environment=PATH` and `ExecStart`.

### Enable the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable nalarin
sudo systemctl start nalarin
sudo systemctl status nalarin
```

View logs:

```bash
journalctl -u nalarin -f
```

Common operational commands:

```bash
sudo systemctl restart nalarin
sudo systemctl stop nalarin
sudo systemctl status nalarin
```

## 9. Configure Nginx

Create a new site file:

```bash
sudo tee /etc/nginx/sites-available/nalarin > /dev/null <<'EOF'
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
EOF
```

Enable the site and test the config:

```bash
sudo ln -s /etc/nginx/sites-available/nalarin /etc/nginx/sites-enabled/nalarin
sudo nginx -t
sudo systemctl reload nginx
```

If the default Nginx site is still enabled and conflicts with this site, remove the default symlink:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Install SSL with Certbot

Install Certbot:

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

Request a certificate:

```bash
sudo certbot --nginx -d nalarin.id -d www.nalarin.id
```

If you only use one domain, run:

```bash
sudo certbot --nginx -d nalarin.id
```

Verify renewal:

```bash
sudo certbot renew --dry-run
```

If you update `.env` after SSL is active, restart the application:

```bash
sudo systemctl restart nalarin
```

## 11. Deploy Future Updates

Log in as `deploy`:

```bash
sudo -iu deploy
cd /var/www/nalarin
git pull
```

Install dependencies and build according to the runtime.

Node.js/npm:

```bash
npm ci
npm run build
sudo systemctl restart nalarin
```

Bun:

```bash
bun install
bun run build
sudo systemctl restart nalarin
```

If there are new migrations, run them before restarting the application:

```bash
cat drizzle/*.sql | mysql -u nalarin -p nalarin
```

For repeated deployments, do not run old SQL migration files twice. Apply only new migrations or use the migration procedure agreed on by the team.

## 12. Final Check

After SSL is active, verify:

```bash
curl -I https://nalarin.id
sudo systemctl status nginx
sudo systemctl status nalarin
```

Quick checklist:

- Homepage loads
- Login and registration work
- Admin redirect to `/admin` works
- File upload works
- Google OAuth callback matches the production domain
- Sitemap and robots use the correct domain
- Service logs do not show repeated errors

## Quick Troubleshooting

- If login fails after moving to production, check `APP_URL`, `NEXT_PUBLIC_APP_URL`, and `GOOGLE_REDIRECT_URI`.
- If uploads fail, make sure `public/uploads/` exists and is writable by the `deploy` user.
- If Nginx rejects large requests, increase `client_max_body_size`.
- If the application fails to start, check `journalctl -u nalarin -f`.
- If install or build fails with Bun, redeploy with Node.js/npm.
- If the domain is different from `nalarin.id`, update the metadata domain in `src/app/layout.tsx`, `src/app/robots.ts`, and `src/app/sitemap.ts`.

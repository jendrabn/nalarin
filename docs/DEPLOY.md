# Deployment Guide

This guide explains how to deploy Nalarin to an Ubuntu Server 22.04 VPS using Bun, PM2, Nginx, and GitHub Actions.

The first deployment must be performed manually because the `.env` file must be created directly on the VPS. The workflow does not create, modify, or transmit `.env` values.

## Target Configuration

- OS: Ubuntu Server 22.04 LTS
- Application VPS user: `deploy`
- Application directory: `/var/www/nalarin`
- Runtime: Bun
- Process manager: PM2
- Reverse proxy: Nginx
- SSL: Certbot
- Auto-deploy branch: `main`
- Application port: `APP_PORT` from `.env`, default `3001`

The auto-deploy workflow is located at `.github/workflows/deploy.yml`.

## 1. Prerequisites

Make sure the following are available:

- A domain pointing to the VPS IP address, for example `nalarin.web.id`.
- Root access or a sudo user on the VPS.
- Open ports `22`, `80`, and `443`.
- The GitHub repository is accessible from the VPS.
- `.env.example` is available in the repository.
- Production database credentials and API keys are ready.

## 2. Server Setup

Log in to the VPS as root or as a sudo user.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx mysql-server build-essential python3 curl ca-certificates unzip
```

If you use UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Secure MySQL:

```bash
sudo mysql_secure_installation
```

## 3. Create the Deploy User and Application Directory

Use a non-root user. This guide uses the username `deploy`.

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /var/www/nalarin
sudo chown -R deploy:deploy /var/www/nalarin
sudo chmod 755 /var/www
sudo chmod 755 /var/www/nalarin
```

Switch to the `deploy` user:

```bash
sudo -iu deploy
```

Install Bun as the `deploy` user:

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
which bun
```

Install PM2:

```bash
bun add -g pm2
pm2 -v
```

Enable PM2 startup:

```bash
pm2 startup
```

Run the `sudo env PATH=... pm2 startup ...` command displayed by PM2, then switch back to the `deploy` user if the shell changes.

## 4. Create `VPS_SSH_KEY` for GitHub Actions

`VPS_SSH_KEY` is the private key stored in GitHub Actions so the workflow can SSH into the VPS as the `deploy` user.

Generate this key directly on the VPS as the `deploy` user:

```bash
sudo -iu deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "github-actions-nalarin-deploy" -f ~/.ssh/nalarin-gh-actions-vps
```

When prompted for a passphrase, press `Enter` twice. This workflow does not configure an SSH agent for private keys that use a passphrase.

Generated files:

- `~/.ssh/nalarin-gh-actions-vps`: private key for the GitHub Secret `VPS_SSH_KEY`
- `~/.ssh/nalarin-gh-actions-vps.pub`: public key for the VPS

Allow the key to log in as the `deploy` user:

```bash
cat ~/.ssh/nalarin-gh-actions-vps.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Display the private key:

```bash
cat ~/.ssh/nalarin-gh-actions-vps
```

Keep this output available for the next section. It will be copied into the GitHub Secret `VPS_SSH_KEY`.

## 5. Configure GitHub Secrets and Variables

Open:

```text
Repository -> Settings -> Secrets and variables -> Actions
```

Add the following repository secrets:

- `VPS_HOST`: VPS IP address or hostname, for example `203.0.113.10`
- `VPS_USER`: `deploy`
- `VPS_PORT`: `22`, optional because the workflow defaults to `22`
- `VPS_SSH_KEY`: the contents of the private key displayed from `~/.ssh/nalarin-gh-actions-vps`

The private key was displayed in the previous section with:

```bash
cat ~/.ssh/nalarin-gh-actions-vps
```

Copy the entire content, including:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

After the GitHub Secret has been saved, remove the private key file from the VPS. The VPS only needs the public key inside `authorized_keys`; GitHub Actions is the side that needs the private key.

```bash
rm ~/.ssh/nalarin-gh-actions-vps
chmod 644 ~/.ssh/nalarin-gh-actions-vps.pub
```

Add the repository variable below if the deployment path does not use the default value:

- `DEPLOY_PATH`: `/var/www/nalarin`

## 6. Configure VPS Access to the GitHub Repository

The workflow runs `git fetch origin main` from the VPS. Therefore, the `deploy` user on the VPS must have pull access to the repository.

Use a different key from `VPS_SSH_KEY`. The key in this section is only used by the VPS to pull the repository from GitHub.

On the VPS, as the `deploy` user:

```bash
sudo -iu deploy
ssh-keygen -t ed25519 -C "deploy@nalarin-vps" -f ~/.ssh/github_nalarin
chmod 700 ~/.ssh
chmod 600 ~/.ssh/github_nalarin
chmod 644 ~/.ssh/github_nalarin.pub
ssh-keyscan github.com >> ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
```

Display the public key:

```bash
cat ~/.ssh/github_nalarin.pub
```

Add it to GitHub:

```text
Repository -> Settings -> Deploy keys -> Add deploy key
```

Fill in:

- Title: `nalarin-vps-deploy`
- Key: the contents of `~/.ssh/github_nalarin.pub`
- Allow write access: leave unchecked

Create the SSH config file:

```bash
nano ~/.ssh/config
```

Content:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile /home/deploy/.ssh/github_nalarin
  IdentitiesOnly yes
```

Set the correct permissions and test the connection:

```bash
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

A successful GitHub message usually still says that shell access is not available. This is normal as long as GitHub recognizes the key.

## 7. First Manual Deployment

Continue as the `deploy` user.

Clone the repository:

```bash
cd /var/www
git clone git@github.com:OWNER/REPOSITORY.git nalarin
cd /var/www/nalarin
git remote -v
```

Replace `OWNER/REPOSITORY` with your actual repository. If the remote still uses HTTPS:

```bash
git remote set-url origin git@github.com:OWNER/REPOSITORY.git
```

Set the basic permissions and create runtime upload directories:

```bash
sudo chown -R deploy:deploy /var/www/nalarin
chmod 755 /var/www/nalarin
mkdir -p public/uploads/{avatars,blog,questions,taxonomy}
chmod 755 public
chmod -R 775 public/uploads
```

Create `.env` manually:

```bash
cp .env.example .env
nano .env
chmod 600 .env
```

Generate internal secrets directly on the VPS:

```bash
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use one generated value for `SESSION_PASSWORD` and a different generated value for `CRON_SECRET`:

```env
SESSION_PASSWORD=first-generated-value
CRON_SECRET=second-generated-value
```

If Node.js is not available but OpenSSL is available, use:

```bash
openssl rand -hex 32
```

`.env` checklist:

- `NODE_ENV=production`
- `APP_URL` and `NEXT_PUBLIC_APP_URL` are identical and match the production domain, for example `https://nalarin.web.id`.
- `APP_PORT=3001` or another port that will be used by Nginx.
- `DATABASE_URL` points to the production database.
- `SESSION_PASSWORD` is at least 32 characters long.
- `CRON_SECRET` is a random secret, different from `SESSION_PASSWORD`.
- `GOOGLE_REDIRECT_URI` exactly matches the callback URL configured in Google Cloud.
- Email provider, Midtrans, AI, cron, and file storage variables are configured according to production needs.
- `FILE_STORAGE_PUBLIC_DIR=public/uploads` if using local uploads.

Important note: `NEXT_PUBLIC_*` variables are read during `bun run build`, so their values must be correct before building.

If OAuth values are changed after the app has already been built, rebuild the
application before reloading PM2. The built server can still serve values from
the previous build until `bun run build` is run again.

## 8. Database, Migration, and Seed

Create the MySQL database and user:

```bash
sudo mysql
```

```sql
CREATE DATABASE nalarin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nalarin'@'localhost' IDENTIFIED BY 'CHANGE_TO_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON nalarin.* TO 'nalarin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Run the migration:

```bash
cd /var/www/nalarin
cat drizzle/*.sql | mysql -u nalarin -p nalarin
```

Seed the initial data:

```bash
bun run db:seed
```

For future deployments, do not run all old migrations again. Run only the new migrations according to the team procedure.

## 9. Build and Run with PM2

Install dependencies and build the application:

```bash
cd /var/www/nalarin
bun install
bun run build
```

Run a smoke test:

```bash
bun run start -- --port 3001
```

In another SSH session, test the application:

```bash
curl -I http://127.0.0.1:3001
```

If it works, stop the `bun run start` process with `Ctrl+C`, then run the application with PM2:

```bash
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 status nalarin
```

Basic logs and operations:

```bash
pm2 logs nalarin
pm2 restart nalarin --update-env
pm2 stop nalarin
pm2 monit
```

## 9.1 Updating `.env` After Deployment

Edit the production environment file only on the VPS:

```bash
cd /var/www/nalarin
nano .env
chmod 600 .env
```

Use production values, not localhost values:

```env
NODE_ENV=production
APP_URL=https://nalarin.web.id
NEXT_PUBLIC_APP_URL=https://nalarin.web.id
GOOGLE_REDIRECT_URI=https://nalarin.web.id/api/auth/google/callback
```

After any `.env` change, rebuild and reload the process:

```bash
cd /var/www/nalarin
bun run build
pm2 restart nalarin --update-env
```

For OAuth changes, verify the running app is using the expected client ID and
callback URL:

```bash
curl -I https://nalarin.web.id/api/auth/google
```

The `location` header must contain the expected `client_id` and this redirect
URI, URL-encoded:

```text
https://nalarin.web.id/api/auth/google/callback
```

If the `location` header still shows an old `client_id`, rebuild the app and
restart PM2 again. If it still does not change, check that PM2 is running from
the expected directory:

```bash
pm2 describe nalarin
pm2 env nalarin | grep GOOGLE_CLIENT_ID
```

## 10. Configure Nginx

Create the site configuration:

```bash
sudo nano /etc/nginx/sites-available/nalarin
```

Content:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name nalarin.web.id www.nalarin.web.id;

    client_max_body_size 50m;

    location /uploads/ {
        alias /var/www/nalarin/public/uploads/;
        try_files $uri =404;
        access_log off;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

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

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/nalarin /etc/nginx/sites-enabled/nalarin
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Uploaded files are written at runtime into `public/uploads`. In production,
serve `/uploads/` directly from Nginx instead of proxying those requests to
Next.js. This avoids cached 404 responses for files created after the build.

Profile avatars are returned by the application through
`/api/account/avatar/<filename>` and read from the same `public/uploads/avatars`
directory. Other uploaded assets such as blog, question, and taxonomy images
still use `/uploads/...`, so the Nginx `/uploads/` alias is still required.

## 11. Install SSL

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d nalarin.web.id -d www.nalarin.web.id
sudo certbot renew --dry-run
```

If you only use the main domain:

```bash
sudo certbot --nginx -d nalarin.web.id
```

## 12. Auto Deployment

After the first manual deployment is complete, every push to the `main` branch will run the workflow.

The workflow performs the following steps:

```bash
cd /var/www/nalarin
git fetch origin main
git reset --hard origin/main
mkdir -p public/uploads/{avatars,blog,questions,taxonomy}
chmod -R ug+rwX public/uploads
bun install
bun run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
curl -I https://nalarin.web.id/logout
curl https://nalarin.web.id/api/account/avatar/avatar-1-00000000-0000-0000-0000-000000000000.png
```

Consequence of `git reset --hard`: manual changes to Git-tracked files on the VPS will be overwritten. The `.env` file and `public/uploads` files are safe as long as they remain untracked by Git and are stored under `/var/www/nalarin`.

The workflow also validates that production `APP_URL` and
`NEXT_PUBLIC_APP_URL` are not localhost values and are identical, then recreates
the runtime upload directories before building.

After PM2 reloads, the workflow runs smoke tests against the production domain:

- `GET /logout` must not return a `Set-Cookie` header that clears `nalarin_session`.
- `/logout` must not redirect to `localhost` or `127.0.0.1`.
- `/api/account/avatar/<filename>` must be handled by the dynamic avatar route.

If one of these checks fails, the deployment is not actually serving the fixed
build or the reverse proxy/environment configuration is still wrong.

The workflow will fail if:

- `/var/www/nalarin/.git` does not exist.
- `/var/www/nalarin/.env` does not exist.
- The `deploy` user cannot SSH from GitHub Actions.
- The `deploy` user cannot pull the repository from GitHub.
- `bun install` or `bun run build` fails.
- PM2 cannot reload the process.

## 13. Permission Checklist

Audit:

```bash
namei -l /var/www/nalarin
ls -ld /var/www /var/www/nalarin /var/www/nalarin/public /var/www/nalarin/public/uploads /var/www/nalarin/public/uploads/avatars
ls -l /var/www/nalarin/.env
ls -ld /home/deploy/.ssh
ls -l /home/deploy/.ssh/authorized_keys /home/deploy/.ssh/config /home/deploy/.ssh/github_nalarin
```

Target permissions:

```text
/var/www                              root:root      755
/var/www/nalarin                      deploy:deploy  755
/var/www/nalarin/.env                 deploy:deploy  600
/var/www/nalarin/public               deploy:deploy  755
/var/www/nalarin/public/uploads       deploy:deploy  775
/var/www/nalarin/public/uploads/avatars deploy:deploy 775
/home/deploy/.ssh                     deploy:deploy  700
/home/deploy/.ssh/authorized_keys     deploy:deploy  600
/home/deploy/.ssh/config              deploy:deploy  600
/home/deploy/.ssh/github_nalarin      deploy:deploy  600
```

Fix permissions if needed:

```bash
sudo chown -R deploy:deploy /var/www/nalarin
sudo chmod 755 /var/www /var/www/nalarin
sudo chmod 755 /var/www/nalarin/public
sudo mkdir -p /var/www/nalarin/public/uploads/{avatars,blog,questions,taxonomy}
sudo chmod -R 775 /var/www/nalarin/public/uploads
sudo chmod 600 /var/www/nalarin/.env
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/config
sudo chmod 600 /home/deploy/.ssh/github_nalarin
```

## 14. Final Check

```bash
curl -I https://nalarin.web.id
pm2 status nalarin
pm2 logs nalarin --lines 50
sudo nginx -t
sudo systemctl status nginx
```

Application checklist:

- The homepage opens correctly.
- Login and registration work.
- Admin users are redirected to `/admin` correctly.
- `curl -I https://nalarin.web.id/logout` does not include `Set-Cookie: nalarin_session=...Max-Age=0`.
- `curl -I https://nalarin.web.id/logout` does not redirect to `localhost`.
- File uploads work. Test non-avatar uploaded files with `curl -I https://nalarin.web.id/uploads/...`.
- Profile avatar files work after upload. Test the saved `avatar_url` with `curl -I https://nalarin.web.id/api/account/avatar/<filename>`.
- The Google OAuth callback matches the production domain.
- The sitemap and robots files use the production domain.
- PM2 logs do not contain recurring errors.

## Troubleshooting

- GitHub Actions SSH fails: check `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`, and `/home/deploy/.ssh/authorized_keys`.
- `git fetch` fails: check the VPS deploy key with `ssh -T git@github.com`.
- The workflow fails because of `.env`: manually create `/var/www/nalarin/.env` and run `chmod 600 .env`.
- Uploads fail: check the ownership and permissions of `public/uploads`, and ensure Nginx has a `location /uploads/` block using `alias /var/www/nalarin/public/uploads/`.
- Uploaded files exist on disk but return 404: reload Nginx after adding the `/uploads/` alias, then test the exact file URL with `curl -I`.
- The domain does not open: check DNS, firewall, `sudo nginx -t`, and the Nginx status.
- `.env` changes are not loaded: run `bun run build`, then `pm2 restart nalarin --update-env`.
- Google OAuth still uses an old client ID: run `curl -I https://nalarin.web.id/api/auth/google` and inspect the `location` header, then rebuild and restart PM2.
- The build fails: run `bun run build` manually on the VPS as the `deploy` user.

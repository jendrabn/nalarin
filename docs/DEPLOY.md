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

- A domain pointing to the VPS IP address.
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

Create the key on your local computer, not on the VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions-nalarin-deploy" -f ./nalarin-gh-actions-vps
```

When prompted for a passphrase, press `Enter` twice. This workflow does not configure an SSH agent for private keys that use a passphrase.

Generated files:

- `nalarin-gh-actions-vps`: private key for the GitHub Secret `VPS_SSH_KEY`
- `nalarin-gh-actions-vps.pub`: public key for the VPS

Install the public key on the VPS:

```bash
ssh-copy-id -i ./nalarin-gh-actions-vps.pub deploy@YOUR_VPS_IP
```

If `ssh-copy-id` is not available, install the key manually:

```bash
ssh deploy@YOUR_VPS_IP
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Paste the contents of `nalarin-gh-actions-vps.pub` into `authorized_keys`, then test the connection:

```bash
ssh -i ./nalarin-gh-actions-vps deploy@YOUR_VPS_IP
```

## 5. Configure GitHub Secrets and Variables

Open:

```text
Repository -> Settings -> Secrets and variables -> Actions
```

Add the following repository secrets:

- `VPS_HOST`: VPS IP address or hostname, for example `203.0.113.10`
- `VPS_USER`: `deploy`
- `VPS_PORT`: `22`, optional because the workflow defaults to `22`
- `VPS_SSH_KEY`: the contents of the private key `nalarin-gh-actions-vps`

Read the private key on Linux/macOS:

```bash
cat ./nalarin-gh-actions-vps
```

Or on PowerShell:

```powershell
Get-Content -Raw .\nalarin-gh-actions-vps
```

Copy the entire content, including:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
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

Set the basic permissions:

```bash
sudo chown -R deploy:deploy /var/www/nalarin
chmod 755 /var/www/nalarin
mkdir -p public/uploads
chmod 755 public
chmod 775 public/uploads
```

Create `.env` manually:

```bash
cp .env.example .env
nano .env
chmod 600 .env
```

`.env` checklist:

- `NODE_ENV=production`
- `APP_URL` and `NEXT_PUBLIC_APP_URL` match the production domain.
- `APP_PORT=3001` or another port that will be used by Nginx.
- `DATABASE_URL` points to the production database.
- `SESSION_PASSWORD` is at least 32 characters long.
- `GOOGLE_REDIRECT_URI` exactly matches the callback URL configured in Google Cloud.
- Email provider, Midtrans, AI, cron, and file storage variables are configured according to production needs.
- `FILE_STORAGE_PUBLIC_DIR=public/uploads` if using local uploads.

Important note: `NEXT_PUBLIC_*` variables are read during `bun run build`, so their values must be correct before building.

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

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/nalarin /etc/nginx/sites-enabled/nalarin
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Install SSL

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d nalarin.id -d www.nalarin.id
sudo certbot renew --dry-run
```

If you only use the main domain:

```bash
sudo certbot --nginx -d nalarin.id
```

## 12. Auto Deployment

After the first manual deployment is complete, every push to the `main` branch will run the workflow.

The workflow performs the following steps:

```bash
cd /var/www/nalarin
git fetch origin main
git reset --hard origin/main
bun install
bun run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
```

Consequence of `git reset --hard`: manual changes to Git-tracked files on the VPS will be overwritten. The `.env` file is safe as long as it remains untracked by Git and is stored at `/var/www/nalarin/.env`.

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
ls -ld /var/www /var/www/nalarin /var/www/nalarin/public /var/www/nalarin/public/uploads
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
sudo chmod 775 /var/www/nalarin/public/uploads
sudo chmod 600 /var/www/nalarin/.env
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/config
sudo chmod 600 /home/deploy/.ssh/github_nalarin
```

## 14. Final Check

```bash
curl -I https://nalarin.id
pm2 status nalarin
pm2 logs nalarin --lines 50
sudo nginx -t
sudo systemctl status nginx
```

Application checklist:

- The homepage opens correctly.
- Login and registration work.
- Admin users are redirected to `/admin` correctly.
- File uploads work.
- The Google OAuth callback matches the production domain.
- The sitemap and robots files use the production domain.
- PM2 logs do not contain recurring errors.

## Troubleshooting

- GitHub Actions SSH fails: check `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`, and `/home/deploy/.ssh/authorized_keys`.
- `git fetch` fails: check the VPS deploy key with `ssh -T git@github.com`.
- The workflow fails because of `.env`: manually create `/var/www/nalarin/.env` and run `chmod 600 .env`.
- Uploads fail: check the ownership and permissions of `public/uploads`.
- The domain does not open: check DNS, firewall, `sudo nginx -t`, and the Nginx status.
- `.env` changes are not loaded: run `pm2 restart nalarin --update-env`.
- The build fails: run `bun run build` manually on the VPS as the `deploy` user.

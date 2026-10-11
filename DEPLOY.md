# Deploy TemanNakes ke VPS yang sama dengan UNSPSC-App

- Domain: **https://temannakes.aisatira.web.id**
- Repo: https://github.com/satria133/temannakes
- Server: `139.190.99.191` (user deploy `satbud`, `sudo docker` NOPASSWD —
  sama dengan UNSPSC-App). Reverse proxy: **nginx di host** (bukan container).

```
internet ──► nginx host (:80/:443, sertifikat Let's Encrypt via certbot)
               ├─ domain UNSPSC              ──► (konfigurasi UNSPSC yang sudah ada)
               └─ temannakes.aisatira.web.id ──► 127.0.0.1:3001 ──► container temannakes:3000
```

Container hanya membuka port di `127.0.0.1:3001`, jadi tidak bisa diakses langsung
dari internet — semua lewat nginx. Data (SQLite + kop surat + bukti pelayanan) ada
di named volume `temannakes_temannakes_data`, aman dari update image.

---

## Langkah singkat (sekali saja)

| # | Di mana | Apa |
|---|---|---|
| 1 | DNS `aisatira.web.id` | A record `temannakes` → `139.190.99.191` |
| 2 | Server | folder `/opt/temannakes` + file `.env` |
| 3 | GitHub repo `temannakes` | secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` |
| 4 | GitHub Actions | Run workflow **CI & Deploy** |
| 5 | Server (butuh root/sudo) | pasang site nginx + HTTPS dengan certbot |
| 6 | Browser | buka https://temannakes.aisatira.web.id, login admin |

---

## 1 — DNS

A record host `temannakes` → `139.190.99.191`. Cek:

```bash
dig temannakes.aisatira.web.id +short   # harus 139.190.99.191
```

## 2 — Siapkan server

```bash
ssh -i ~/.ssh/id_ed25519_biznet satbud@139.190.99.191
free -h                                  # kolom "available" sebaiknya > 600Mi
sudo mkdir -p /opt/temannakes && sudo chown satbud:satbud /opt/temannakes
cd /opt/temannakes
openssl rand -hex 32                     # copy hasilnya untuk AUTH_SECRET
nano .env
```

Isi `.env`:

```
AUTH_SECRET=<hasil openssl rand -hex 32>
AUTH_URL=https://temannakes.aisatira.web.id
SEED_ADMIN_EMAIL=admin@temannakes.id
SEED_ADMIN_PASSWORD=<password admin yang kuat>
ADMIN_WHATSAPP=
CREDIT_PRICE_LABEL=
```

Simpan (Ctrl+O, Enter, Ctrl+X), lalu `chmod 600 .env`.

- `SEED_ADMIN_PASSWORD` hanya dipakai saat akun admin **pertama kali** dibuat.
- `ADMIN_WHATSAPP`/`CREDIT_PRICE_LABEL` hanya nilai awal; selanjutnya atur di
  **/admin/settings**.

## 3 — Secrets GitHub

Repo `temannakes` → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|---|---|
| `VPS_HOST` | `139.190.99.191` |
| `VPS_USER` | `satbud` |
| `VPS_SSH_KEY` | isi private key tanpa passphrase (mis. `~/.ssh/id_ed25519_biznet`) |

## 4 — Deploy

GitHub → **Actions → CI & Deploy → Run workflow**. Workflow build image di GitHub,
push ke GHCR, menyalin `docker-compose.yml` + `deploy/nginx/` ke `/opt/temannakes`,
lalu `docker compose pull && up -d`. Saat start, tabel database dibuat dan akun
admin + master kegiatan di-seed otomatis.

Cek di server:

```bash
cd /opt/temannakes
sudo docker compose ps                     # STATUS "Up"
curl -sI http://127.0.0.1:3001 | head -1   # HTTP/1.1 200 OK
```

## 5 — nginx + HTTPS

Langkah ini butuh hak root (bukan hanya `sudo docker`). Cek dulu:

```bash
sudo -l
```

Kalau hasilnya hanya `(root) NOPASSWD: /usr/bin/docker`, login sebagai user yang
punya sudo penuh (atau `root`) untuk langkah ini.

```bash
# lihat konfigurasi yang sudah ada (UNSPSC) — jangan diubah
ls -l /etc/nginx/sites-enabled/

# pasang site TemanNakes (file disalin workflow ke /opt/temannakes/deploy/nginx/)
sudo cp /opt/temannakes/deploy/nginx/temannakes.conf /etc/nginx/sites-available/temannakes
sudo ln -s /etc/nginx/sites-available/temannakes /etc/nginx/sites-enabled/temannakes
sudo nginx -t                              # harus "syntax is ok" dan "test is successful"
sudo systemctl reload nginx
curl -sI http://temannakes.aisatira.web.id | head -3   # harus "X-Powered-By: Next.js"
```

HTTPS (wajib — login tidak akan berfungsi lewat HTTP karena `AUTH_URL` memakai https):

```bash
certbot --version || sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d temannakes.aisatira.web.id --redirect
sudo ufw status                            # 80 dan 443 harus ALLOW (mis. "Nginx Full")
```

Certbot menambahkan blok `listen 443 ssl` ke `/etc/nginx/sites-available/temannakes`,
redirect HTTP → HTTPS, dan memperpanjang sertifikat otomatis.

## 6 — Selesai

Buka https://temannakes.aisatira.web.id, login dengan `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. Database production mulai kosong.

---

## Deploy berikutnya

Push ke `main` → **Actions → CI & Deploy → Run workflow**. nginx tidak perlu
disentuh, kecuali `deploy/nginx/temannakes.conf` berubah — salin ulang secara
manual (jangan timpa blok SSL yang ditambahkan certbot; edit bagian yang berubah
saja), lalu `sudo nginx -t && sudo systemctl reload nginx`.

## Perawatan

Di `/opt/temannakes`:

| Mau ngapain | Perintah |
|---|---|
| Status | `sudo docker compose ps` |
| Log | `sudo docker compose logs -f temannakes` |
| Restart | `sudo docker compose restart` |
| Rollback | edit `image:` di `docker-compose.yml` jadi `ghcr.io/satria133/temannakes:<sha commit>`, lalu `sudo docker compose up -d` |
| Backup | `sudo docker run --rm -v temannakes_temannakes_data:/data -v $PWD:/backup alpine tar czf /backup/temannakes-$(date +%F).tgz -C /data .` |
| Unduh backup ke laptop | `scp -i ~/.ssh/id_ed25519_biznet satbud@139.190.99.191:/opt/temannakes/temannakes-*.tgz .` |
| Log nginx | `sudo tail -f /var/log/nginx/error.log` |

Volume itu satu-satunya salinan database dan bukti pelayanan nakes —
backup secara rutin.

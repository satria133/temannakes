# Deploy TemanNakes ke VPS yang sama dengan UNSPSC-App

- Domain: **https://temannakes.aisatira.web.id**
- Repo: https://github.com/satria133/temannakes
- Server: Droplet DigitalOcean yang menjalankan UNSPSC-App (`/opt/unspsc-app`,
  Docker Compose, Caddy di port 80/443, user deploy `satbud` dengan
  `sudo docker` NOPASSWD — lihat `DEPLOY.md` di repo UNSPSC-App).

```
internet ──► Caddy (container UNSPSC, :80/:443)
               ├─ domain UNSPSC              ──► unspsc-validator:5000
               └─ temannakes.aisatira.web.id ──► temannakes:3000   (network Docker "web")
```

TemanNakes tidak menjalankan Caddy sendiri (port 80/443 sudah dipakai Caddy
UNSPSC). Caddy UNSPSC cukup diberi `docker-compose.override.yml` di server —
**repo UNSPSC-App, `docker-compose.yml`, dan `Caddyfile`-nya tidak diubah**,
jadi `git pull` di `/opt/unspsc-app` tidak akan bentrok.

Data (SQLite + kop surat + bukti pelayanan) ada di named volume
`temannakes_temannakes_data` — aman dari update image.

---

## Langkah singkat (sekali saja)

| # | Di mana | Apa |
|---|---|---|
| 1 | DNS domain `aisatira.web.id` | A record `temannakes` → IP droplet |
| 2 | Server | cek RAM, buat network `web`, folder `/opt/temannakes`, file `.env` |
| 3 | GitHub repo `temannakes` | isi secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` |
| 4 | GitHub Actions | Run workflow **CI & Deploy** |
| 5 | Server | pasang override Caddy di `/opt/unspsc-app`, restart Caddy |
| 6 | Browser | buka https://temannakes.aisatira.web.id, login admin |

Detail tiap langkah di bawah.

---

## 1 — DNS

Di pengelola DNS `aisatira.web.id`, buat **A record** host `temannakes` →
IP droplet. Cek dari server (bisa butuh beberapa menit):

```bash
dig temannakes.aisatira.web.id +short   # harus sama dengan IP droplet
```

## 2 — Siapkan server

```bash
ssh satbud@IP_DROPLET

free -h                          # lihat kolom "available"
sudo docker stats --no-stream    # pemakaian RAM UNSPSC sekarang
```

TemanNakes dibatasi `mem_limit: 512m`. Kalau `available` di bawah ~600MB,
tambah swap 2GB dulu:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Network bersama, folder, dan `.env`:

```bash
sudo docker network create web
sudo mkdir -p /opt/temannakes
sudo chown satbud:satbud /opt/temannakes
cd /opt/temannakes
openssl rand -hex 32       # copy hasilnya
nano .env
```

Isi `.env`:

```
AUTH_SECRET=<hasil openssl rand -hex 32>
AUTH_URL=https://temannakes.aisatira.web.id
SEED_ADMIN_EMAIL=admin@temannakes.id
SEED_ADMIN_PASSWORD=<password admin yang kuat>
ADMIN_WHATSAPP=62812xxxxxxx
CREDIT_PRICE_LABEL=Rp25.000 per dokumen
```

Simpan (Ctrl+O, Enter, Ctrl+X), lalu `chmod 600 .env`.

- `SEED_ADMIN_PASSWORD` hanya dipakai saat akun admin **pertama kali** dibuat;
  mengubahnya belakangan tidak mengganti password admin yang sudah ada.
- `ADMIN_WHATSAPP` (format 62…, tanpa `+`) dan `CREDIT_PRICE_LABEL` dipakai di
  halaman topup kredit. Boleh dikosongkan.

## 3 — Secrets GitHub

Repo `satria133/temannakes` → **Settings → Secrets and variables → Actions →
New repository secret**:

| Secret | Isi |
|---|---|
| `VPS_HOST` | IP droplet |
| `VPS_USER` | `satbud` |
| `VPS_SSH_KEY` | private key SSH untuk `satbud` (sama dengan yang dipakai UNSPSC) |

Isi secret repo UNSPSC tidak bisa dilihat ulang di GitHub. Kalau file private
key-nya sudah tidak ada, buat key deploy baru di laptop:

```bash
ssh-keygen -t ed25519 -f temannakes_deploy -N ""
ssh-copy-id -i temannakes_deploy.pub satbud@IP_DROPLET
cat temannakes_deploy        # isi ini ke VPS_SSH_KEY
```

## 4 — Deploy pertama

GitHub → **Actions → CI & Deploy → Run workflow** (bisa dari GitHub Mobile).

Workflow membangun image di GitHub (tidak makan RAM droplet), push ke
`ghcr.io/satria133/temannakes`, menyalin `docker-compose.yml` + `deploy/` ke
`/opt/temannakes`, lalu `docker compose pull && up -d`. Saat container start,
tabel database dibuat dan akun admin + master kegiatan di-seed otomatis.

Cek di server:

```bash
cd /opt/temannakes
sudo docker compose ps                 # STATUS harus "Up"
sudo docker compose logs -f temannakes # tunggu "Ready", Ctrl+C untuk keluar
curl -I http://127.0.0.1:3001          # harus HTTP 200
```

Push biasa ke `main` hanya typecheck + build image (tidak deploy).

## 5 — Sambungkan ke Caddy UNSPSC

Cek dulu apakah Caddy UNSPSC sedang jalan:

```bash
cd /opt/unspsc-app
sudo docker compose --profile https ps
```

**Kalau ada service `caddy` berstatus Up** (UNSPSC sudah HTTPS):

```bash
cp /opt/temannakes/deploy/unspsc-compose.override.yml /opt/unspsc-app/docker-compose.override.yml
sudo docker compose --profile https config >/dev/null && echo "config OK"
sudo docker compose --profile https up -d caddy
sudo docker compose logs --tail 30 caddy
```

Hanya container Caddy yang dibuat ulang (beberapa detik); UNSPSC tidak
di-rebuild. Di log Caddy harus muncul baris `certificate obtained successfully`
untuk `temannakes.aisatira.web.id`.

**Kalau Caddy belum jalan** (UNSPSC masih diakses `http://IP:5000`): pastikan
`Caddyfile` di `/opt/unspsc-app` sudah berisi domain UNSPSC yang benar (bukan
`your-domain.com`), lalu ikuti Bagian 8 `DEPLOY.md` UNSPSC — langkah di atas
tetap sama, cukup tambahkan file override sebelum `--profile https up -d`.

Firewall cukup 80/443 (port 3001 hanya terbuka di `127.0.0.1`):

```bash
sudo ufw status    # 80/tcp dan 443/tcp harus ALLOW
```

## 6 — Selesai

Buka https://temannakes.aisatira.web.id, login dengan `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. Database production mulai kosong — akun
`nakes.test@…` dari laptop tidak ikut.

---

## Deploy berikutnya

Push ke `main` → GitHub **Actions → CI & Deploy → Run workflow**. Itu saja.

Kalau `deploy/caddy/temannakes.caddy` ikut berubah, restart Caddy setelah deploy:

```bash
cd /opt/unspsc-app && sudo docker compose --profile https restart caddy
```

## Perawatan

Di `/opt/temannakes`:

| Mau ngapain | Perintah |
|---|---|
| Status | `sudo docker compose ps` |
| Log | `sudo docker compose logs -f temannakes` |
| Restart | `sudo docker compose restart` |
| Rollback | edit `image:` di `docker-compose.yml` jadi `ghcr.io/satria133/temannakes:<sha commit>`, lalu `sudo docker compose up -d` |
| Backup | `sudo docker run --rm -v temannakes_temannakes_data:/data -v $PWD:/backup alpine tar czf /backup/temannakes-$(date +%F).tgz -C /data .` |
| Unduh backup ke laptop | `scp satbud@IP_DROPLET:/opt/temannakes/temannakes-*.tgz .` |
| Shell di container | `sudo docker compose exec temannakes sh` |

Volume itu satu-satunya salinan database dan bukti pelayanan nakes —
backup secara rutin.

## Kalau macet

`sudo docker compose logs temannakes` (aplikasi) atau, di `/opt/unspsc-app`,
`sudo docker compose logs caddy` (domain/HTTPS). Kirim teks error-nya ke saya.

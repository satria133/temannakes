# TemanNakes

Aplikasi untuk tenaga kesehatan: pengajuan dokumen SKP / rekapitulasi kegiatan praktik
profesi (approval admin → PDF siap cetak), plus info webinar & loker medis. Next.js 16
(App Router) + Prisma 5 (SQLite) + Auth.js v5 credentials + Tailwind 4 + @react-pdf/renderer.
Baca `README.md` (fitur) dan `DEPLOY.md` (server) sebelum mengubah alur dokumen atau deploy.

## Next.js 16 — bukan versi yang biasa dikenal
Baca `node_modules/next/dist/docs/` sebelum memakai API Next.js. Yang sudah kena di repo ini:
`proxy.ts` (bukan `middleware.ts`), `params`/`searchParams` async (`PageProps<"/route">`,
`RouteContext<...>`), batas body Server Action diatur di `next.config.ts`
(`experimental.serverActions.bodySizeLimit`, sekarang 20mb), `cacheComponents` sengaja mati.

## Struktur singkat
- `src/app/nakes/*` halaman nakes, `src/app/admin/*` panel admin; peran dicek di `src/proxy.ts`
  DAN di tiap page/action/route (`requireNakes`/`requireAdmin` di `src/lib/session.ts`).
- `src/app/nakes/skp/submission-form.tsx` form dipakai bersama buat baru & edit;
  parsing/validasi server di `src/lib/submission-input.ts`.
- `src/lib/pdf/` template + render PDF; `src/lib/credits.ts` kredit; `src/lib/settings.ts`
  pengaturan admin (fallback ke env); `src/lib/storage.ts` upload.
- `prisma/seed.ts` idempoten: admin awal, template kegiatan per profesi, migrasi kode profesi
  lama. Jalan otomatis setiap container start.

## Aturan bisnis (jangan dilanggar tanpa diskusi)
- Draft bebas diedit dan TIDAK terlihat admin. Approve/reject hanya untuk status `SUBMITTED`.
- Pratinjau PDF ber-watermark selalu gratis. Unduh PDF bersih butuh `APPROVED` + `unlockedAt`.
  Edit setelah diajukan butuh `unlockedAt`, dan mengembalikan status ke `SUBMITTED`.
- Buka akses = 1 kredit (`CREDITS_PER_DOCUMENT`), dipotong atomik (`updateMany` dengan
  syarat saldo) supaya klik ganda tidak memotong dua kali. Setiap perubahan kredit dicatat di
  `CreditTransaction`. Admin bisa topup di `/admin/users` atau buka akses gratis per dokumen.
- Topup: nakes kirim `TopupRequest` (jumlah kredit + bukti transfer JPG/PNG/WEBP/PDF ≤5MB, isi file
  dicek, maks 3 PENDING). Admin setujui/tolak di `/admin/topups`; `approveTopup` (`src/lib/topup-requests.ts`)
  atomik (`updateMany` status PENDING) dan mencatat `CreditTransaction`. Bukti disimpan di `topup/` dan
  hanya dilayani ke pemilik & admin lewat `/files`. Info rekening: `bankInfo` di `/admin/settings`.
- Analitik pengunjung: self-hosted, tanpa cookie (`PageView`, `src/lib/analytics.ts`, `/api/track`,
  dasbor `/admin/analytics`). `visitorHash` = hash(IP+UA+hari) sehingga tidak bisa dilacak lintas hari;
  admin/api/files & bot tidak dihitung; segmen ID dinamis diganti `:id`. Butuh `X-Forwarded-For` dari nginx.
- Loker: `/jobs` punya pencarian + filter profesi/provinsi + paginasi (`src/lib/job-filters.ts`).
  Admin mengimpor loker nakes dari LokerMedis.id lewat tombol di `/admin/jobs` (`src/lib/lokermedis-import.ts`).
- Reset password: token sekali pakai (`PasswordResetToken`, hanya hash SHA-256 disimpan, berlaku 1 jam,
  token baru membatalkan yang lama; `src/lib/password-reset.ts`). Dua jalur: admin buat tautan di
  `/admin/users` lalu kirim lewat WhatsApp, atau `/forgot-password` mengirim email bila `SMTP_URL` diisi
  (respons selalu generik, maks 3 permintaan/jam/akun). Sesi JWT lama tidak dicabut saat password diganti.
- Identitas di dokumen (nama, STR, SIP, jabatan, NIP, atasan) disimpan per `ServiceSubmission`,
  bukan dibaca dari profil, agar PDF lama tidak berubah saat profil diedit.
- File upload disimpan di `UPLOAD_DIR` (bukan `public/`) dan hanya dilayani lewat
  `/files/[...path]` ber-auth: bukti pelayanan hanya untuk pemilik & admin.
- Pesan error di URL pakai kode (`?error=insufficient_credits`), jangan teks bebas dari query.
- Rahasia (`AUTH_SECRET`, `SEED_ADMIN_PASSWORD`) hanya di `.env` server. Nomor WA & teks harga
  diatur admin di `/admin/settings`.

## Menjalankan lokal
`npm install && npm run db:push && npm run db:seed && npm run dev` → http://localhost:3000.
Admin lokal default `admin@temannakes.id` / `AdminTemanNakes123`. Jalankan di port yang sama
dengan `NEXTAUTH_URL` di `.env`. Di Windows, hentikan `next dev` sebelum `prisma db push`
(file engine terkunci). SQLite tidak mendukung enum Prisma → string + konstanta di
`src/lib/constants.ts`.

## Verifikasi sebelum push
`npx next typegen && npx tsc --noEmit`. `next build` lokal di laptop Windows sering kehabisan
memori — CI GitHub Actions (push ke `main`) menjalankan typecheck + build image Docker.

## Deploy
- Pola sama dengan UNSPSC-App, tapi aplikasinya TIDAK terhubung dengan UNSPSC.
- Push ke `main` = CI saja. Deploy = GitHub Actions → **CI & Deploy** → Run workflow
  (build image → GHCR → SSH `satbud@139.190.99.191` → `docker compose pull && up -d`
  di `/opt/temannakes`).
- Container hanya di `127.0.0.1:3001`. Reverse proxy = **nginx di host**, dipakai bersama
  `app.aisatira.web.id` dan `unspsc.aisatira.web.id`. Site file:
  `/etc/nginx/sites-available/temannakes` (acuan: `deploy/nginx/temannakes.conf`), HTTPS via
  certbot. Selalu `sudo nginx -t && sudo systemctl reload nginx`; jangan sentuh site lain.
- Data produksi di volume `temannakes_temannakes_data` (SQLite + uploads) — satu-satunya
  salinan, backup sebelum perubahan skema yang berisiko. Skema diterapkan dengan
  `prisma db push` saat start: perubahan yang bisa menghapus kolom/data harus didiskusikan dulu.

# TemanNakes (P1)

Aplikasi untuk tenaga kesehatan (apoteker, dokter, perawat, bidan, TTLM,
tenaga vokasi farmasi): pengajuan dokumen SKP/rekapitulasi praktik profesi
dengan approval admin dan PDF siap cetak, serta info webinar & loker medis.

## Stack

Next.js 16 (App Router, TypeScript, Turbopack) · Prisma + SQLite (dev) ·
Auth.js v5 (credentials) · Tailwind CSS · @react-pdf/renderer.

## Menjalankan secara lokal

```bash
npm install
npm run db:push     # buat skema di dev.db (SQLite)
npm run db:seed      # buat akun admin + master data kegiatan per profesi
npm run dev
```

Buka http://localhost:3000. Pastikan menjalankan di port yang sama dengan
`NEXTAUTH_URL` pada `.env` (default `http://localhost:3000`), kalau tidak
redirect login akan mengarah ke host yang salah.

Akun admin default (ubah via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` di
`.env` sebelum seeding jika perlu):

```
admin@temannakes.id / AdminTemanNakes123
```

Nakes mendaftar sendiri lewat halaman `/register`.

## Struktur fitur

- `/nakes/profile` — lengkapi data profesional.
- `/nakes/skp` — riwayat pengajuan SKP, `/nakes/skp/new` untuk mengajukan baru.
- `/admin/submissions` — review & approve/reject pengajuan SKP.
- `/admin/webinars`, `/admin/jobs` — kelola info webinar & loker.
- `/webinars`, `/jobs` — listing publik (webinar H-7 di-highlight), bisa
  berlangganan jika sudah login.

## Catatan produksi

- Database: skema `prisma/schema.prisma` pakai SQLite untuk kemudahan dev
  (Prisma tidak mendukung enum di SQLite, jadi field seperti `role`,
  `profession`, `status` disimpan sebagai string dan divalidasi di
  `src/lib/constants.ts`). Untuk produksi, ganti `provider` ke `postgresql`
  dan set `DATABASE_URL` yang sesuai.
- File upload (kop surat instansi & bukti pelayanan) disimpan di
  `UPLOAD_DIR` (default `storage/uploads/`, di Docker `/app/data/uploads`)
  dan hanya dilayani lewat route ber-auth `/files/...` — bukti pelayanan
  hanya bisa dibuka pemiliknya dan admin.
- Panduan deploy ke VPS yang sama dengan UNSPSC-App: lihat `DEPLOY.md`.
- `AUTH_SECRET` di `.env` adalah nilai development — wajib diganti dengan
  secret acak yang kuat di produksi.

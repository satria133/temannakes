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

- `/nakes/profile` — data profesional default (10 profesi: ATLM, Perawat, Dokter,
  Dokter Gigi, Vokasi Farmasi, Apoteker, Radiologi, Psikolog Klinis, Fisioterapi, Gizi).
- `/nakes/skp/new` — buat dokumen: profesi, identitas (nama, STR, SIP, jabatan, NIP
  opsional), instansi/kop surat, atasan (+ NIP opsional), tabel kegiatan, bukti.
  Bisa **Simpan Draft** dulu.
- `/nakes/skp/[id]` — pratinjau PDF ber-watermark (selalu gratis), buka akses dengan
  kredit, unduh PDF bersih (setelah disetujui), edit berkas.
- `/nakes/topup` — saldo kredit, cara topup (WhatsApp admin), riwayat transaksi.
- `/admin/submissions` — review & approve/reject pengajuan SKP, pratinjau PDF, buka
  akses gratis.
- `/admin/users` — tambah/koreksi kredit nakes setelah pembayaran topup.

Aturan akses dokumen: draft bebas diedit; setelah diajukan, edit dan unduh PDF
bersih butuh akses terbuka (1 kredit per dokumen, atau dibuka admin). Edit setelah
diajukan/disetujui mengembalikan dokumen ke antrean review.
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

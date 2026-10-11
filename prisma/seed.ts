import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Activity templates mirror the categories found in the sample
// "Rekapitulasi Kegiatan Praktik Profesi/Pelayanan" PDFs for each profession.
const ACTIVITY_TEMPLATES: Record<
  string,
  { group?: string; name: string }[]
> = {
  TTLM: [
    { group: "Pra Analitik", name: "Sampling Darah, Swab" },
    { group: "Analitik", name: "Pemeriksaan Hema, KK, Urin, Faeces, Mikrobiologi, Imser, PCR" },
    { group: "Pasca Analitik", name: "Pencatatan dan Pelaporan, Verifikasi dan Validasi Hasil" },
  ],
  PERAWAT: [
    { name: "Melakukan Pengkajian Keperawatan dasar pada kelompok" },
    { name: "Melakukan dokumentasi tindakan keperawatan" },
    { name: "Melakukan pemantauan perkembangan pasien sesuai dengan kondisinya" },
    { name: "Melakukan perawatan luka" },
    { name: "Heacting" },
    { name: "EKG" },
    { name: "Pemasangan Infus" },
    { name: "Pemasangan Kateter" },
    { name: "Pemasangan NGT" },
    { name: "Nebulizer" },
    { name: "Pemasangan Spalk Dewasa (Fraktur)" },
  ],
  TENAGA_VOKASI_FARMASI: [
    { group: "Administrasi Keprofesian", name: "Melakukan penerimaan obat" },
    { group: "Administrasi Keprofesian", name: "Melakukan penyimpanan obat" },
    { group: "Administrasi Keprofesian", name: "Stok opname" },
    { group: "Pelayanan Pemeriksaan Keprofesian", name: "Melakukan pelayanan resep racikan" },
    { group: "Pelayanan Pemeriksaan Keprofesian", name: "Melakukan pelayanan resep non racikan" },
  ],
  APOTEKER: [
    { group: "Administrasi Keprofesian", name: "Membuat perencanaan kebutuhan obat dan BHP" },
    { group: "Administrasi Keprofesian", name: "Membuat surat pesanan obat dan BHP" },
    { group: "Administrasi Keprofesian", name: "Membuat Laporan dan analisa pengelolaan obat dan BHP (Psiko, Narko, dll)" },
    { group: "Pelayanan Pemeriksaan Keprofesian", name: "PIO" },
    { group: "Pelayanan Pemeriksaan Keprofesian", name: "Pelayanan Resep" },
    { group: "Pelayanan Pemeriksaan Keprofesian", name: "Asuhan Kefarmasian (khusus RS)" },
  ],
  DOKTER_UMUM: [
    { name: "Pemeriksaan Pasien" },
    { name: "Tindakan Hecting" },
    { name: "Membaca Rontgen" },
    { name: "Membaca EKG" },
    { name: "Melakukan Injeksi" },
    { name: "Nebulizer" },
    { name: "Pasang Infus" },
    { name: "Pemeriksaan Pasien Rawat Jalan" },
    { name: "Pelayanan USG Ibu Hamil" },
    { name: "Pelayanan Pasien IGD" },
    { name: "Pelayanan Rawat Inap" },
  ],
  BIDAN: [
    { name: "Memberikan Pelayanan pada Ibu Hamil" },
    { name: "Memberikan Pelayanan pada Ibu Bersalin" },
    { name: "Memberikan Pelayanan pada BBL" },
    { name: "Memberikan Pelayanan pada Ibu Nifas" },
    { name: "Memberikan Pelayanan Imunisasi" },
    { name: "Memberikan Pelayanan Keluarga Berencana" },
    { name: "Memberikan Pelayanan Kesehatan Reproduksi" },
  ],
  LAINNYA: [],
};

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@temannakes.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminTemanNakes123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash, role: "ADMIN" },
    update: {},
  });

  console.log(`Admin ready: ${adminEmail} / ${adminPassword}`);

  for (const [profession, activities] of Object.entries(ACTIVITY_TEMPLATES)) {
    for (const [index, activity] of activities.entries()) {
      const existing = await prisma.activityTemplate.findFirst({
        where: { profession, name: activity.name },
      });
      if (!existing) {
        await prisma.activityTemplate.create({
          data: {
            profession,
            groupLabel: activity.group,
            name: activity.name,
            sortOrder: index,
          },
        });
      }
    }
  }

  console.log("Seeded activity templates for", Object.keys(ACTIVITY_TEMPLATES).length, "professions");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LEGACY_PROFESSION_CODES, PROFESSIONS } from "../src/lib/constants";

const prisma = new PrismaClient();

// Defaults per profession. Nakes can still add their own rows per document.
// ATLM/Perawat/Vokasi Farmasi/Apoteker/Dokter follow the sample
// "Rekapitulasi Kegiatan Praktik Profesi" templates in docs/reference.
const ACTIVITY_TEMPLATES: Record<string, { group?: string; name: string }[]> = {
  ATLM: [
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
  DOKTER: [
    { name: "Pemeriksaan Pasien Rawat Jalan" },
    { name: "Pelayanan Pasien IGD" },
    { name: "Pelayanan Rawat Inap" },
    { name: "Tindakan Hecting" },
    { name: "Membaca Rontgen" },
    { name: "Membaca EKG" },
    { name: "Melakukan Injeksi" },
    { name: "Nebulizer" },
    { name: "Pasang Infus" },
    { name: "Pelayanan USG Ibu Hamil" },
  ],
  DOKTER_GIGI: [
    { name: "Pemeriksaan Gigi dan Mulut" },
    { name: "Penambalan Gigi" },
    { name: "Pencabutan Gigi" },
    { name: "Perawatan Saluran Akar" },
    { name: "Scaling / Pembersihan Karang Gigi" },
    { name: "Penyuluhan Kesehatan Gigi dan Mulut" },
  ],
  VOKASI_FARMASI: [
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
  RADIOLOGI: [
    { name: "Pemeriksaan Radiografi Konvensional (Thorax, Ekstremitas, dll)" },
    { name: "Pemeriksaan Radiografi dengan Kontras" },
    { name: "Pemeriksaan CT Scan" },
    { name: "Pemeriksaan USG (asistensi)" },
    { name: "Pengolahan dan Dokumentasi Citra" },
  ],
  PSIKOLOG_KLINIS: [
    { name: "Asesmen / Pemeriksaan Psikologis" },
    { name: "Konseling Individu" },
    { name: "Psikoterapi" },
    { name: "Tes Psikologi" },
    { name: "Psikoedukasi Kelompok" },
  ],
  FISIOTERAPI: [
    { name: "Asesmen Fisioterapi" },
    { name: "Terapi Latihan" },
    { name: "Elektroterapi" },
    { name: "Terapi Manual" },
    { name: "Edukasi Pasien dan Keluarga" },
  ],
  GIZI: [
    { name: "Asesmen / Skrining Gizi Pasien" },
    { name: "Konseling Gizi" },
    { name: "Penyusunan Diet / Asuhan Gizi Pasien Rawat Inap" },
    { name: "Penyelenggaraan Makanan" },
    { name: "Penyuluhan Gizi" },
  ],
};

async function migrateLegacyProfessionCodes() {
  for (const [oldCode, newCode] of Object.entries(LEGACY_PROFESSION_CODES)) {
    await prisma.nakesProfile.updateMany({ where: { profession: oldCode }, data: { profession: newCode } });
    await prisma.serviceSubmission.updateMany({ where: { profession: oldCode }, data: { profession: newCode } });
    await prisma.activityTemplate.updateMany({ where: { profession: oldCode }, data: { profession: newCode } });
  }
  // Professions dropped from the list keep their data but stop offering defaults.
  await prisma.activityTemplate.updateMany({
    where: { profession: { notIn: [...PROFESSIONS] } },
    data: { isActive: false },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@temannakes.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminTemanNakes123";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: "ADMIN",
      },
    });
    console.log(`Admin created: ${adminEmail}`);
  }

  await migrateLegacyProfessionCodes();

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

  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

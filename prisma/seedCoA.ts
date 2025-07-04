import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function main() {
  const coas = [
    { kode: "501.01.002.002", jenis_transaksi: "Bantuan Pendidikan - Fakir Miskin" },
    { kode: "501.01.002.003", jenis_transaksi: "Bantuan Kesehatan - Fakir Miskin" },
    { kode: "501.01.002.004", jenis_transaksi: "Bantuan Ekonomi - Fakir Miskin" },
    { kode: "501.01.002.007", jenis_transaksi: "Operasional Program_Kegiatan" },
    { kode: "501.01.006.001", jenis_transaksi: "Penyaluran Zakat untuk Fisabilillah" },
    { kode: "501.01.006.012", jenis_transaksi: "Gaji Dan Tunjangan SDM Program" },
    { kode: "501.01.006.022", jenis_transaksi: "Operasional Program_Kegiatan" },
    { kode: "502.02.001.000", jenis_transaksi: "Penyaluran Dana Dakwah Sosial" },
    { kode: "502.02.003.000", jenis_transaksi: "Penyaluran Dana Pemberdayaan Ekonomi" },
    { kode: "502.02.004.000", jenis_transaksi: "Penyaluran Dana Pendidikan" },
    { kode: "502.02.007.000", jenis_transaksi: "Penyaluran Dana Kemanusiaan/ Bencana" },
    { kode: "502.02.013.000", jenis_transaksi: "Penyaluran Non Cash Infaq/Sedekah Terikat Kemanusiaan" },
    { kode: "502.02.014.000", jenis_transaksi: "Penyaluran Non Cash Infaq/Sedekah Terikat Dakwah" },
    { kode: "502.03.003.000", jenis_transaksi: "Program Kesehatan - Infaq/Sedekah Tidak Terikat" },
    { kode: "502.03.005.000", jenis_transaksi: "Program Dakwah Sosial - Infaq/Sedekah Tidak Terikat" },
    { kode: "502.03.007.000", jenis_transaksi: "Program Pemberdayaan Komunitas - Infaq/Sedekah Tidak Terikat" },
    { kode: "502.03.008.000", jenis_transaksi: "Penyaluran Non Cash Infaq/Sedekah Tidak Terikat" },
    { kode: "504.02.001.000", jenis_transaksi: "Penyaluran Hibah untuk Pihak Ketiga" },
    { kode: "508.02.001.000", jenis_transaksi: "Penyaluran Amil dari Dana DSKL" },
    { kode: "508.04.000.000", jenis_transaksi: "Penyaluran Dana Fidyah" },
  ];

  for (const coa of coas) {
    await prisma.coA.upsert({
      where: { kode: coa.kode },
      update: {
        jenis_transaksi: coa.jenis_transaksi,
        updated_at: new Date(),
      },
      create: {
        ...coa,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  console.log("✅ Seeding selesai.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

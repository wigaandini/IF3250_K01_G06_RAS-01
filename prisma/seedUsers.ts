import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function main() {
  console.log("🧹 Menghapus data lama...");

  // Hapus data dengan urutan aman (relasi dependent → induk)
  await prisma.parameterFieldValue.deleteMany({});
  await prisma.penyaluran.deleteMany({});
  await prisma.riwayat_Bantuan.deleteMany({});
  await prisma.lokasi_Bantuan.deleteMany({});
  await prisma.parameterField.deleteMany({});
  await prisma.programSumberDana.deleteMany({});
  await prisma.program_Bantuan.deleteMany({});
  await prisma.mustahiqKondisiFoto.deleteMany({});
  await prisma.mustahiqProgram.deleteMany({});
  await prisma.mustahiqAsnaf.deleteMany({});
  await prisma.mustahiq.deleteMany({});
  await prisma.asnaf.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Semua data lama berhasil dihapus.");
  console.log("\u2728 Seeding user, mustahiq, and program bantuan...");

  const hashedAdminPassword = await bcrypt.hash("adminpassword", SALT_ROUNDS);
  const hashedAmilPassword = await bcrypt.hash("amilpassword", SALT_ROUNDS);

  // Seed Users
  const user1 = await prisma.user.upsert({
    where: { email: "admin@rumahamal.org" },
    update: {},
    create: {
      nama: "Super Admin",
      email: "admin@rumahamal.org",
      password: hashedAdminPassword,
      role: "superadmin",
      alamat: "Jl. Sudirman No. 1, Bandung",
      no_telp: "081234567891",
      created_at: new Date()
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "amil@rumahamal.org" },
    update: {},
    create: {
      nama: "Amil User",
      email: "amil@rumahamal.org",
      password: hashedAmilPassword,
      role: "amil",
      alamat: "Jl. Diponegoro No. 45, Bandung",
      no_telp: "081298765432",
      created_at: new Date()
    },
  });

  const asnafTypes = ['fakir', 'miskin', 'amil', 'muallaf', 'riqab', 'gharim', 'fisabilillah', 'ibnu sabil'];
  await Promise.all(asnafTypes.map(type =>
    prisma.asnaf.upsert({ where: { type }, update: {}, create: { type } })
  ));
  const asnafs = await prisma.asnaf.findMany();

  const mustahiqData = [];
  for (let i = 0; i < 10; i++) {
  const selectedAsnafTypes = asnafs.sort(() => 0.5 - Math.random()).slice(0, 2);
  const mustahiq = await prisma.mustahiq.create({
    data: {
      NIK: `3200${Date.now().toString().slice(-10)}${i}`,
      nama: `Mustahiq ${i + 1}`,
      jenis_kelamin: i % 2 === 0 ? "Laki-laki" : "Perempuan",
      tempat_lahir: "Jakarta",
      tanggal_lahir: new Date(1985 + i, i % 12, 1),
      no_telepon: `08120000000${i}`,
      email: `mustahiq${i + 1}@example.com`,
      alamat: `Jl. Random ${i + 1}, Jakarta`,
      kode_pos: `16500${i}`,
      GPS_lat: -6.2 + i * 0.01,
      GPS_long: 106.8 + i * 0.01,
      status: "active",
      status_pernikahan: "Menikah",
      pekerjaan: "Freelancer",
      agama: "Islam",
      pendidikan_terakhir: "S1",
      jumlah_anggota_kk: 3 + i,
      foto_kk: `kk${i}.jpg`,
      foto_ktp: `ktp${i}.jpg`,
      foto_mustahiq: `foto${i}.jpg`,
      created_by: user2.id,
      created_at: new Date(),
      asnafs: {
        create: selectedAsnafTypes.map(asnaf => ({ asnaf: { connect: { id: asnaf.id } }}))
      }
    }
  });


    await prisma.mustahiqKondisiFoto.createMany({
      data: [
        {
          mustahiq_id: mustahiq.id,
          url: `kondisi_${i}_1.jpg`,
        },
        {
          mustahiq_id: mustahiq.id,
          url: `kondisi_${i}_2.jpg`,
        },
      ]
    });

    mustahiqData.push(mustahiq);
  }

  console.log("\u2705 10 Mustahiqs seeded!");

  const program = await prisma.program_Bantuan.create({
    data: {
      nama_program: 'Program Beasiswa Yatim',
      bidang_kategori: 'pendidikan',
      unit_penyalur: 'pusat',
      kepala_program: user1.id,
      deskripsi: 'Memberikan beasiswa untuk anak-anak yatim berprestasi.',
      status: 'active',
      created_at: new Date()
    }
  });

  await prisma.programSumberDana.createMany({
    data: [
      {
        program_id: program.id,
        sumber_dana: 'Zakat',
        nominal: 1000000,
        catatan_sumber_dana: 'Paragon'
      },
      {
        program_id: program.id,
        sumber_dana: 'Zakat',
        nominal: 1000000,
        catatan_sumber_dana: 'PT Antam'
      }
    ]
  });

  await prisma.parameterField.createMany({
    data: [
      {
        program_id: program.id,
        field_name: 'Nama Sekolah',
        field_type: 'text',
        is_required: true,
        description: 'Tempat sekolah mustahiq',
        created_at: new Date()
      },
      {
        program_id: program.id,
        field_name: 'Tingkat Pendidikan',
        field_type: 'select',
        is_required: true,
        options: JSON.stringify(['SD', 'SMP', 'SMA']),
        description: 'Jenjang pendidikan mustahiq',
        created_at: new Date()
      },
      {
        program_id: program.id,
        field_name: 'Jumlah Beasiswa',
        field_type: 'number',
        is_required: true,
        description: 'Jumlah dana yang diberikan',
        created_at: new Date()
      }
    ]
  });

  const fields = await prisma.parameterField.findMany({ where: { program_id: program.id } });
  const [namaSekolah, tingkatPendidikan, jumlahBeasiswa] = fields;
  const defaultCoa = await prisma.coA.findFirst();
  if (!defaultCoa) {
    throw new Error("No default CoA found. Please seed at least one CoA before running this script.");
  }

  for (const mustahiq of mustahiqData) {
    const penyaluran = await prisma.penyaluran.create({
      data: {
        mustahiq_id: mustahiq.id,
        program_id: program.id,
        tanggal: new Date(),
        jumlah: 1000000,
        catatan: "Penyaluran awal",
        status: "delivered",
        created_by: user2.id,
        created_at: new Date(),
        coa_cred_id: defaultCoa.id,
        coa_debt_id: defaultCoa.id
      }
    });

    await prisma.parameterFieldValue.createMany({
      data: [
        {
          program_id: program.id,
          field_id: namaSekolah.id,
          mustahiq_id: mustahiq.id,
          penyaluran_id: penyaluran.id,
          value: `SD Negeri ${mustahiq.id}`,
          created_at: new Date()
        },
        {
          program_id: program.id,
          field_id: tingkatPendidikan.id,
          mustahiq_id: mustahiq.id,
          penyaluran_id: penyaluran.id,
          value: ['SD', 'SMP', 'SMA'][mustahiq.id % 3],
          created_at: new Date()
        },
        {
          program_id: program.id,
          field_id: jumlahBeasiswa.id,
          mustahiq_id: mustahiq.id,
          penyaluran_id: penyaluran.id,
          value: `${1000000 + mustahiq.id * 100000}`,
          created_at: new Date()
        }
      ]
    });
  }

  console.log("\u2705 Semua data penyaluran dan field value berhasil ditambahkan!");
}

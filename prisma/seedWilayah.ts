import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

function cleanName(name: string): string {
  return name.replace(/\s*\(.*?\)/g, "").trim(); 
}

function readCSV(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ",",
  });
}

export async function main() {
  console.log("🌍 Seeding data wilayah Indonesia...");

  const provinsis = readCSV(path.join(__dirname, "data/provinsi.csv"));
  const kabupatens = readCSV(path.join(__dirname, "data/kabupaten_kota.csv"));
  const kecamatans = readCSV(path.join(__dirname, "data/kecamatan.csv"));
  const kelurahans = readCSV(path.join(__dirname, "data/kelurahan.csv"));

  const provinsiMap = new Map<string, number>();
  const kabupatenMap = new Map<string, number>();
  const kecamatanMap = new Map<string, number>();

  // Seed Provinsi
  for (const { id, name } of provinsis) {
    try {
      const prov = await prisma.provinsi.create({
        data: { kode: id, nama: cleanName(name) },
      });
      provinsiMap.set(id, prov.id);
    } catch (err: any) {
      if (err.code === "P2002") {
        const existing = await prisma.provinsi.findUnique({ where: { kode: id } });
        if (existing) provinsiMap.set(id, existing.id);
      } else {
        throw err;
      }
    }
  }

  // Seed Kabupaten/Kota
  for (const { id, name } of kabupatens) {
    const provId = id.split(".")[0];
    try {
      const kab = await prisma.kabupaten.create({
        data: {
          kode: id,
          nama: cleanName(name),
          provinsi: {
            connect: { kode: provId },
          },
        },
      });
      kabupatenMap.set(id, kab.id);
    } catch (err: any) {
      if (err.code === "P2002") {
        const existing = await prisma.kabupaten.findUnique({ where: { kode: id } });
        if (existing) kabupatenMap.set(id, existing.id);
      } else {
        throw err;
      }
    }
  }

  // Seed Kecamatan
  for (const { id, name } of kecamatans) {
    const kabId = id.split(".").slice(0, 2).join(".");
    try {
      const kec = await prisma.kecamatan.create({
        data: {
          kode: id,
          nama: cleanName(name),
          kabupaten: {
            connect: { kode: kabId },
          },
        },
      });
      kecamatanMap.set(id, kec.id);
    } catch (err: any) {
      if (err.code === "P2002") {
        const existing = await prisma.kecamatan.findUnique({ where: { kode: id } });
        if (existing) kecamatanMap.set(id, existing.id);
      } else {
        throw err;
      }
    }
  }

  // Seed Kelurahan/Desa
  for (const { id, name } of kelurahans) {
    const kecId = id.split(".").slice(0, 3).join(".");
    try {
      await prisma.kelurahan.create({
        data: {
          kode: id,
          nama: cleanName(name),
          kecamatan: {
            connect: { kode: kecId },
          },
        },
      });
    } catch (err: any) {
      if (err.code !== "P2002") throw err;
    }
  }

  console.log("✅ Selesai seeding wilayah!");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("❌ Gagal:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

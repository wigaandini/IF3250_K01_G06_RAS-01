import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "7");
  const sortBy = searchParams.get("sortBy") || "nama";
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.kelurahan.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        kecamatan: {
          include: {
            kabupaten: {
              include: {
                provinsi: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.kelurahan.count();
    return NextResponse.json({ data, total });
  } catch (err) {
    console.error("Error fetching kelurahan:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { kode, nama, kecamatan_id } = await req.json();
  if (!kode || !nama || !kecamatan_id)
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });

  const created = await prisma.kelurahan.create({ data: { kode, nama, kecamatan_id } });
  return NextResponse.json(created, { status: 201 });
}

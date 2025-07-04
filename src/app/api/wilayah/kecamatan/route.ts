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
    const data = await prisma.kecamatan.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        kabupaten: {
          include: {
            provinsi: true,
          },
        },
      },
    });

    const total = await prisma.kecamatan.count();
    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("Error fetching kecamatan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { kode, nama, kabupaten_id } = await req.json();
  if (!kode || !nama || !kabupaten_id) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  const created = await prisma.kecamatan.create({ data: { kode, nama, kabupaten_id } });
  return NextResponse.json(created, { status: 201 });
}

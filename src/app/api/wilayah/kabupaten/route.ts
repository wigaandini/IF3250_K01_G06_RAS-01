import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const sortBy = searchParams.get("sortBy") || "nama";
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const search = searchParams.get("search") || "";
  const skip = (page - 1) * limit;

  try {
    const data = await prisma.kabupaten.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        provinsi: true,
      },
      where: search
        ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { kode: { contains: search, mode: "insensitive" } },
          ],
        }
        : undefined,
    });

    const total = await prisma.provinsi.count({
      where: search
        ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { kode: { contains: search, mode: "insensitive" } },
          ],
        }
        : undefined,
    });
    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("Error fetching kabupaten:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provinsi_id, nama } = body;

    if (!provinsi_id || !nama) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const provinsi = await prisma.provinsi.findUnique({ where: { id: provinsi_id } });
    if (!provinsi) {
      return NextResponse.json({ error: "Provinsi tidak ditemukan" }, { status: 404 });
    }

    const lastKabupaten = await prisma.kabupaten.findMany({
      where: { provinsi_id },
      orderBy: { kode: "desc" },
      take: 1,
    });

    const provinsiKode = provinsi.kode;
    const nextKode = (() => {
      if (lastKabupaten.length === 0) return `${provinsiKode}.01`;

      const last = lastKabupaten[0].kode.split(".")[1]; // ambil '05' dari '11.05'
      const nextNumber = String(parseInt(last) + 1).padStart(2, "0");
      return `${provinsiKode}.${nextNumber}`;
    })();

    const created = await prisma.kabupaten.create({
      data: {
        nama,
        provinsi_id,
        kode: nextKode,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menambah kabupaten." }, { status: 500 });
  }
}
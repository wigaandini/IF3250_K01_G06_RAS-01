import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET: Ambi provinsi
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const sortBy = searchParams.get("sortBy") || "nama";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    try {
        const data = await prisma.provinsi.findMany({
            skip,
            take: limit,
            orderBy: {
                [sortBy]: "asc",
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
        console.error("Error fetching provinsi:", error);
        return NextResponse.json({ error: "Gagal fetch data" }, { status: 500 });
    }
}


// POST: Tambah provinsi
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { kode, nama } = body;
        const existing = await prisma.provinsi.findUnique({ where: { kode } });

        if (existing) {
            return NextResponse.json({ error: "Kode sudah ada" }, { status: 409 });
        }


        if (!kode || !nama) {
            return NextResponse.json({ error: "Field 'kode' dan 'nama' wajib diisi." }, { status: 400 });
        }

        const created = await prisma.provinsi.create({ data: { kode, nama } });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error("Error creating provinsi:", error);
        return NextResponse.json({ error: "Gagal menambah provinsi" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "secret_fallback");

async function verifyToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const list = await prisma.coA.findMany({
            orderBy: { kode: "asc" },
        });
        return NextResponse.json(list);
    } catch (error) {
        console.error("FETCH COA error:", error);
        return NextResponse.json({ error: "Failed to fetch COA" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await verifyToken();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await req.json();
        const { kode, jenis_transaksi } = data;

        // Validasi field
        if (!kode || !jenis_transaksi) {
            return NextResponse.json({ error: "Kode dan jenis_transaksi wajib diisi." }, { status: 400 });
        }

        // Validasi format kode CoA: NNN.NN.NNN.NNN
        const coaRegex = /^\d{3}\.\d{2}\.\d{3}\.\d{3}$/;
        if (!coaRegex.test(kode)) {
            return NextResponse.json({ error: "Format kode COA tidak valid. Gunakan format NNN.NN.NNN.NNN" }, { status: 400 });
        }

        const created = await prisma.coA.create({
            data: {
                kode,
                jenis_transaksi,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true, data: created });
    } catch (error: any) {
        console.error("CREATE COA error:", error);

        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Kode COA sudah digunakan." }, { status: 409 });
        }

        return NextResponse.json({ error: "Gagal menambahkan COA" }, { status: 500 });
    }
}

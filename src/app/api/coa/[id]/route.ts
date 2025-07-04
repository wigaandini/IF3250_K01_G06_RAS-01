import { NextRequest, NextResponse } from "next/server";
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await verifyToken();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    try {
        const data = await req.json();
        const { kode, jenis_transaksi } = data;

        if (!kode || !jenis_transaksi) {
            return NextResponse.json({ error: "Kode dan jenis_transaksi wajib diisi." }, { status: 400 });
        }

        const coaRegex = /^\d{3}\.\d{2}\.\d{3}\.\d{3}$/;
        if (!coaRegex.test(kode)) {
            return NextResponse.json({ error: "Format kode COA tidak valid. Gunakan format NNN.NN.NNN.NNN" }, { status: 400 });
        }

        const updated = await prisma.coA.update({
            where: { id },
            data: {
                kode,
                jenis_transaksi,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if ((error as any).code === 'P2002') {
                return NextResponse.json({ error: "Kode COA sudah digunakan." }, { status: 409 });
            }
            console.error("UPDATE COA error:", error.message);
        } else {
            console.error("UPDATE COA error:", error);
        }

        return NextResponse.json({ error: "Gagal mengupdate COA" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await verifyToken();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    try {
        await prisma.coA.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("DELETE COA error:", error);
        return NextResponse.json({ error: "Gagal menghapus COA" }, { status: 500 });
    }
}

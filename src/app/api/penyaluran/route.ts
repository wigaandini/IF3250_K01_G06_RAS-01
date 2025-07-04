import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers"
import { jwtVerify } from "jose"


const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret")

async function getUserIdFromToken() {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY)
        return payload.id as number
    } catch {
        return null
    }
}


// GET: Semua penyaluran
export async function GET() {
    try {
        const all = await prisma.penyaluran.findMany({
            include: {
                mustahiq: true,
                program: true,
                creator: true,
                coa_cred: true,
                coa_debt: true,
            },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json(all);
    } catch (error) {
        console.error("GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST: Buat penyaluran baru
export async function POST(req: Request) {
    const userId = await getUserIdFromToken();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();
        const {
            mustahiq_id,
            program_id,
            tanggal,
            jumlah,
            catatan,
            status,
            parameterValues,
        } = data;

        // Validate required fields
        if (!mustahiq_id || !program_id || !tanggal || !jumlah) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const penyaluran = await prisma.penyaluran.create({
            data: {
                mustahiq_id,
                program_id,
                tanggal: new Date(tanggal),
                jumlah,
                catatan,
                status,
                coa_cred_id: data.coa_cred_id,
                coa_debt_id: data.coa_debt_id,
                created_by: userId,
                created_at: new Date(),
            },
        });

        if (Array.isArray(parameterValues)) {
            await Promise.all(
                parameterValues.map((p: { field_id: number; value: string }) =>
                    prisma.parameterFieldValue.create({
                        data: {
                            program: { connect: { id: program_id } },
                            field: { connect: { id: p.field_id } },
                            mustahiq: { connect: { id: mustahiq_id } },
                            penyaluran: { connect: { id: penyaluran.id } },
                            value: p.value,
                            created_at: new Date(),
                        },
                    })
                )
            );
        }

        return NextResponse.json(
            { message: "Penyaluran created", penyaluran },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}


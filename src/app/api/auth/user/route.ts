import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key");

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const userId = payload.id as number | undefined;

        if (typeof userId !== 'number') {
            return NextResponse.json({ error: "Invalid token payload" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, nama: true, role: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
}

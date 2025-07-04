import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key");

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return NextResponse.json({ id: payload.id, role: payload.role });
    } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
// import { z } from "zod";

const prisma = new PrismaClient();

//validasi pake zod
// const userSchema = z.object({
//   nama: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter"),
//   email: z.string().email("Format email tidak valid"),
//   password: z.string().min(6, "Password harus memiliki setidaknya 6 karakter"),
//   role: z.enum(["superadmin", "amil", "relawan"]),
//   alamat: z.string().optional().default(""),
//   no_telp: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Nomor telepon tidak valid").optional().default(""),
// });

/**
 * GET /api/users
 * Ambil daftar semua pengguna
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Tambah pengguna baru dengan validasi
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // console.log("Received Data:", body);

    // const validationResult = userSchema.safeParse(body);
    // if (!validationResult.success) {
    //   return NextResponse.json(
    //     { error: "Validasi gagal", details: validationResult.error.errors },
    //     { status: 400 }
    //   );
    // }

    // const { nama, email, password, role, alamat, no_telp } = validationResult.data;
    const { nama, email, password, role, alamat, no_telp } = body;

    if (!nama || !email || !password || !role) {
      return NextResponse.json({ error: "Semua field wajib diisi!" }, { status: 400 });
    }
    // Cek apakah email sudah terdaftar
    // const existingUser = await prisma.user.findUnique({ where: { email } });
    // if (existingUser) {
    //   return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
    // }

    const hashedPass = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { nama, email, password: hashedPass, role, alamat, no_telp },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

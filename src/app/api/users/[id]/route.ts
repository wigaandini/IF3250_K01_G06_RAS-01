import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
// import { z } from "zod";

const prisma = new PrismaClient();


// validasi pake zod juga
// const updateUserSchema = z.object({
//   nama: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter").optional(),
//   email: z.string().email("Format email tidak valid").optional(),
//   password: z.string().min(6, "Password harus memiliki setidaknya 6 karakter").optional(),
//   role: z.enum(["superadmin", "amil", "relawan"]).optional(),
//   alamat: z.string().optional().default(""),
//   no_telp: z
//     .string()
//     .regex(/^\+?[1-9]\d{1,14}$/, "Nomor telepon tidak valid")
//     .optional()
//     .default(""),
// });

/**
 * GET /api/users/[id]
 * Ambil user berdasarkan ID
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(params.id) } });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]
 * Update user berdasarkan ID
 */
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = parseInt(url.pathname.split("/").pop() || "", 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    // const validationResult = updateUserSchema.safeParse(body);
    // if (!validationResult.success) {
    //   return NextResponse.json({ error: "Validasi gagal", details: validationResult.error.errors }, { status: 400 });
    // }
    const { nama, email, password, role, alamat } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    let hashedPass = existingUser.password;
    if (password) {
      hashedPass = await bcrypt.hash(password, 12);
    }
    // if (body.password) {
    //   hashedPass = await bcrypt.hash(body.password, 12);
    // }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nama: nama || existingUser.nama,
        email: email || existingUser.email,
        password: hashedPass,
        role: role || existingUser.role,
        alamat: alamat || existingUser.alamat,
        no_telp: body.no_telp || existingUser.no_telp,
      },
    });

    // const updatedUser = await prisma.user.update({
    //   where: { id },
    //   data: {
    //     nama: body.nama || existingUser.nama,
    //     email: body.email || existingUser.email,
    //     password: hashedPass,
    //     role: body.role || existingUser.role,
    //     alamat: body.alamat || existingUser.alamat,
    //     no_telp: body.no_telp || existingUser.no_telp,
    //   },
    // });

    return NextResponse.json({ message: "User berhasil diperbarui", user: updatedUser });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


/**
 * DELETE /api/users/[id]
 * Hapus user berdasarkan ID
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ message: "User berhasil dihapus" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
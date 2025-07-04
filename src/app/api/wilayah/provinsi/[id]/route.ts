import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { kode, nama } = await req.json();
    const id = Number(params.id);

    const existing = await prisma.provinsi.findFirst({
      where: {
        kode,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Kode sudah digunakan provinsi lain" }, { status: 409 });
    }
    const updated = await prisma.provinsi.update({
      where: { id: Number(params.id) },
      data: { kode, nama },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Gagal update provinsi" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.provinsi.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ message: "Provinsi dihapus" });
  } catch {
    return NextResponse.json({ error: "Gagal hapus provinsi" }, { status: 500 });
  }
}

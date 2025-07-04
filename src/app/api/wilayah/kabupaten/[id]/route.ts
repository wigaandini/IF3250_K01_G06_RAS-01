import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { kode, nama, provinsi_id } = await req.json();
  const updated = await prisma.kabupaten.update({
    where: { id: Number(params.id) },
    data: { kode, nama, provinsi_id },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.kabupaten.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ message: "Kabupaten dihapus" });
}

// /app/api/mustahiq/by-program/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const programId = parseInt(id);
  
  if (isNaN(programId)) {
    return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
  }
  
  try {
    // Get penyaluran records with mustahiq information
    const penyaluranList = await prisma.penyaluran.findMany({
      where: {
        program_id: programId,
        mustahiq_id: { not: null },
      },
      include: {
        mustahiq: {
          include: {
            asnafs: {
              include: {
                asnaf: true,
              },
            },
            creator: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
    });
    
    // Transform the data to include penyaluran date with each mustahiq
    const mustahiqWithDates = penyaluranList.map(p => ({
      ...p.mustahiq,
      tanggal_penyaluran: p.tanggal,
      penyaluran_id: p.id,
      penyaluran_status: p.status,
      penyaluran_jumlah: p.jumlah
    }));
    
    return NextResponse.json(mustahiqWithDates);
  } catch (error) {
    console.error("Failed to fetch mustahiqs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
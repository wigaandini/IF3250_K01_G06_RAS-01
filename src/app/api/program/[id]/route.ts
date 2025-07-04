import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

interface ParameterFieldInput {
  field_name: string;
  field_type: string;
  is_required?: boolean;
  options?: string[];
  description?: string;
}

interface SumberDanaInput {
  sumber_dana: string;
  nominal: number;
  catatan_sumber_dana?: string;
}

const prisma = new PrismaClient();

// GET /api/program/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const programId = parseInt(id);
    
    if (isNaN(programId)) return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    
    const program = await prisma.program_Bantuan.findUnique({
      where: { id: programId },
      include: {
        ParameterField: true,
        ParameterFieldValue: true,
        program_sumber_dana: true,
      },
    });
    
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    return NextResponse.json(program);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/program/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const programId = parseInt(id);
    const data = await req.json();
    
    const updatedProgram = await prisma.program_Bantuan.update({
      where: { id: programId },
      data: {
        nama_program: data.nama_program,
        bidang_kategori: data.bidang_kategori,
        unit_penyalur: data.unit_penyalur,
        kepala_program: data.kepala_program,
        nama_mitra: data.nama_mitra,
        kategori_mitra: data.kategori_mitra,
        catatan_mitra: data.catatan_mitra,
        deskripsi: data.deskripsi,
        kriteria: data.kriteria,
        jumlah_bantuan: data.jumlah_bantuan,
        tanggal_mulai: data.tanggal_mulai ? new Date(data.tanggal_mulai) : null,
        tanggal_selesai: data.tanggal_selesai ? new Date(data.tanggal_selesai) : null,
        status: data.status,
        updated_at: new Date(),
      },
    });
    
    if (Array.isArray(data.parameterFields)) {
      await prisma.parameterFieldValue.deleteMany({
        where: {
          field: {
            program_id: programId,
          },
        },
      });
      await prisma.parameterField.deleteMany({ where: { program_id: programId } });
      await Promise.all(
        (data.parameterFields as ParameterFieldInput[]).map((f) =>
          prisma.parameterField.create({
            data: {
              program_id: programId,
              field_name: f.field_name,
              field_type: f.field_type,
              is_required: f.is_required ?? false,
              options: f.options ?? Prisma.DbNull,
              description: f.description ?? null,
              created_at: new Date(),
            },
          })
        )
      );
    }
    
    if (Array.isArray(data.program_sumber_dana)) {
      await prisma.programSumberDana.deleteMany({ where: { program_id: programId } });
      await prisma.programSumberDana.createMany({
        data: (data.program_sumber_dana as SumberDanaInput[]).map((entry) => ({
          program_id: programId,
          sumber_dana: entry.sumber_dana,
          nominal: entry.nominal,
          catatan_sumber_dana: entry.catatan_sumber_dana ?? null,
        })),
      });
    }
    
    return NextResponse.json({ message: "Program updated successfully", program: updatedProgram });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/program/[id]
export async function DELETE(_: Request, context: { params: { id: string } }) {
  try {
    const { params } = await context;
    const { id } = params;
    const programId = parseInt(id);
    
    if (isNaN(programId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    // First check if the program exists
    const existingProgram = await prisma.program_Bantuan.findUnique({
      where: { id: programId }
    });
    
    if (!existingProgram) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    
    // If program exists, proceed with deletion
    await prisma.parameterFieldValue.deleteMany({
      where: {
        field: {
          program_id: programId,
        },
      },
    });
    await prisma.parameterField.deleteMany({ where: { program_id: programId } });
    await prisma.programSumberDana.deleteMany({ where: { program_id: programId } });
    await prisma.program_Bantuan.delete({ where: { id: programId } });
    
    return NextResponse.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/program/[id]
export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    const { params } = await context;
    const { id } = params;
    const { status } = await req.json();
    
    const updatedProgram = await prisma.program_Bantuan.update({
      where: { id: Number(id) },
      data: {
        status,
        updated_at: new Date(),
      },
    });
    
    return NextResponse.json({ message: "Program status updated", program: updatedProgram });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
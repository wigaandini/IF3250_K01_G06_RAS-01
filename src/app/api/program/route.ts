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

// GET /api/program
export async function GET() {
  try {
    const programs = await prisma.program_Bantuan.findMany({
      include: {
        ParameterField: true,
        program_sumber_dana: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const enrichedPrograms = await Promise.all(
      programs.map(async (program) => {
        // Ambil semua penyaluran yang terkait dengan program ini
        const penyaluran = await prisma.penyaluran.findMany({
          where: {
            program_id: program.id,
            mustahiq_id: { not: null },
          },
          select: {
            mustahiq_id: true,
            jumlah: true,
          },
        });

        const mustahiqIds = new Set(penyaluran.map((p) => p.mustahiq_id));
        const jumlah_mustahiq_dibantu = mustahiqIds.size;

        const nominal_terpakai = penyaluran.reduce((acc, p) => acc + (p.jumlah ?? 0), 0);

        const totalNominal = await prisma.programSumberDana.aggregate({
          where: { program_id: program.id },
          _sum: { nominal: true },
        });

        return {
          ...program,
          jumlah_mustahiq_dibantu,
          nominal_terpakai,
          total_nominal: totalNominal._sum.nominal || 0,
        };
      })
    );

    return NextResponse.json(enrichedPrograms);
  } catch (error) {
    console.error("GET all error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/program
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const newProgram = await prisma.program_Bantuan.create({
      data: {
        nama_program: data.nama_program,
        bidang_kategori: data.bidang_kategori,
        unit_penyalur: data.unit_penyalur,
        kepala_program: Number(data.kepala_program) || 0,
        nama_mitra: data.nama_mitra,
        kategori_mitra: data.kategori_mitra,
        catatan_mitra: data.catatan_mitra,
        deskripsi: data.deskripsi,
        kriteria: data.kriteria,
        jumlah_bantuan: data.jumlah_bantuan,
        tanggal_mulai: data.tanggal_mulai ? new Date(data.tanggal_mulai) : null,
        tanggal_selesai: data.tanggal_selesai ? new Date(data.tanggal_selesai) : null,
        status: data.status,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: data.created_by || null,
      },
    });

    if (Array.isArray(data.parameterFields)) {
      await Promise.all(
        (data.parameterFields as ParameterFieldInput[]).map((f) =>
          prisma.parameterField.create({
            data: {
              program_id: newProgram.id,
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

    if (Array.isArray(data.sumber_dana_list)) {
      await prisma.programSumberDana.createMany({
        data: (data.sumber_dana_list as SumberDanaInput[]).map((entry) => ({
          program_id: newProgram.id,
          sumber_dana: entry.sumber_dana,
          nominal: entry.nominal,
          catatan_sumber_dana: entry.catatan_sumber_dana ?? null,
        })),
      });
    }

    return NextResponse.json({ message: "Program created successfully", program: newProgram });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

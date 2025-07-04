// app/api/penyaluran/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/penyaluran/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const penyaluran = await prisma.penyaluran.findUnique({
      where: { id },
      include: {
        mustahiq: true,
        program: {
          include: {
            ParameterField: true, 
          },
        },
        ParameterFieldValue: true,
        creator: {
          select: {
            id: true,
            nama: true,
            email: true,
          }
        },
        coa_cred: true,
        coa_debt: true,
      },
    });

    if (!penyaluran) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Format parameter values for the frontend
    const parameterValues = penyaluran.program?.ParameterField.map((field) => {
      const matchedValue = penyaluran.ParameterFieldValue.find(
        (val) => val.field_id === field.id
      );
      return {
        id: field.id,
        field_name: field.field_name,
        field_type: field.field_type,
        is_required: field.is_required,
        description: field.description,
        value: matchedValue?.value || "", // Ensure an empty string if no value
      };
    }) || [];

    // Format date for frontend date input (YYYY-MM-DD)
    const formattedDate = penyaluran.tanggal
      ? penyaluran.tanggal.toISOString().split('T')[0]
      : "";

    return NextResponse.json({
      id: penyaluran.id,
      mustahiq_id: penyaluran.mustahiq_id,
      program_id: penyaluran.program_id,
      tanggal: formattedDate,
      jumlah: penyaluran.jumlah,
      catatan: penyaluran.catatan,
      status: penyaluran.status,
      parameter_values: parameterValues,
      mustahiq: penyaluran.mustahiq ? {
        id: penyaluran.mustahiq.id,
        nama: penyaluran.mustahiq.nama,
        NIK: penyaluran.mustahiq.NIK,
        alamat: penyaluran.mustahiq.alamat,
      } : null,
      program: penyaluran.program ? {
        id: penyaluran.program.id,
        nama_program: penyaluran.program.nama_program,
      } : null,
      creator: penyaluran.creator ? {
        id: penyaluran.creator.id,
        nama: penyaluran.creator.nama,
      } : null,
      coa_cred: penyaluran.coa_cred ? {
        id: penyaluran.coa_cred.id,  
        kode: penyaluran.coa_cred.kode,
        nama: penyaluran.coa_cred.jenis_transaksi,
      } : null,
      coa_debt: penyaluran.coa_debt ? {
        id: penyaluran.coa_debt.id,  
        kode: penyaluran.coa_debt.kode,
        nama: penyaluran.coa_debt.jenis_transaksi,
      } : null,
    });

  } catch (error) {
    console.error("GET detail error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/penyaluran/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params before accessing its properties
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const data = await req.json();
    // console.log("Received update data:", data);

    const updated = await prisma.penyaluran.update({
      where: { id },
      
      data: {
        mustahiq_id: data.mustahiq_id,
        program_id: data.program_id,
        tanggal: new Date(data.tanggal),
        jumlah: data.jumlah,
        catatan: data.catatan,
        status: data.status,
        coa_cred_id: data.coa_cred_id,
        coa_debt_id: data.coa_debt_id,
        updated_at: new Date(),
        updated_by: data.updated_by ?? null,
      },
    });

    await prisma.parameterFieldValue.deleteMany({
      where: { penyaluran_id: id },
    });

    if (Array.isArray(data.parameterValues)) {
      await Promise.all(
        data.parameterValues.map((param: { field_id: number; value: string }) =>
          prisma.parameterFieldValue.create({
            data: {
              field_id: param.field_id,
              program_id: data.program_id,
              mustahiq_id: data.mustahiq_id,
              penyaluran_id: id,
              value: param.value || "",
              created_at: new Date(),
            },
          })
        )
      );
    }

    return NextResponse.json({ message: "Updated successfully", updated });

  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/penyaluran/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.parameterFieldValue.deleteMany({
      where: { penyaluran_id: id },
    });

    await prisma.penyaluran.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });

  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
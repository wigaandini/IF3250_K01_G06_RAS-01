import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key");

export async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.id as number;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserIdFromToken();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const penyaluranRecords = await prisma.penyaluran.findMany({
      include: {
        mustahiq: true,
        program: true,
        coa_debt: true,
        coa_cred: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Penyaluran");

    // Define columns sesuai dengan gambar
    worksheet.columns = [
      { header: "ID PM", key: "id_pm", width: 15 },
      { header: "ID Program", key: "id_program", width: 15 },
      { header: "COA Debet", key: "coa_debet", width: 15 },
      { header: "COA Kredit", key: "coa_kredit", width: 15 },
      { header: "Nominal", key: "nominal", width: 15 },
      { header: "Tgl Salur", key: "tgl_salur", width: 15 },
      { header: "Keterangan", key: "keterangan", width: 30 },
      { header: "Nama PM", key: "nama_pm", width: 25 },
    ];

    // Fill data
    for (const record of penyaluranRecords) {
      worksheet.addRow({
        id_pm: record.mustahiq_id || "", 
        id_program: record.program_id || "", 
        coa_debet: record.coa_debt?.kode || "", 
        coa_kredit: record.coa_cred?.kode || "", 
        nominal: record.jumlah || 0, 
        tgl_salur: record.created_at ? record.created_at.toISOString().split("T")[0] : "", 
        keterangan: record.catatan || "", 
        nama_pm: record.program?.nama_program || "", 
      });
    }

    // Convert to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=DataPenyaluran.xlsx",
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json({ error: "Gagal membuat file Excel" }, { status: 500 });
  }
}
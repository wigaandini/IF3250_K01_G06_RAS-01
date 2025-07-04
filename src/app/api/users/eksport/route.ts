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
    const userRecords = await prisma.user.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Pengguna");

    // Define columns sesuai dengan format yang diminta
    worksheet.columns = [
      { header: "ID Pengguna", key: "id", width: 15 },
      { header: "Nama Pengguna", key: "nama", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "No Telp", key: "no_telp", width: 15 },
      { header: "Alamat", key: "alamat", width: 30 },
      { header: "Peran", key: "role", width: 15 },
      { header: "Tgl Reg", key: "created_at", width: 15 },
    ];

    // Fill data
    for (const record of userRecords) {
      worksheet.addRow({
        id: record.id,
        nama: record.nama || "",
        email: record.email,
        no_telp: record.no_telp,
        alamat: record.alamat,
        role: record.role || "",
        created_at: record.created_at ? record.created_at.toISOString().split("T")[0] : "",
      });
    }

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Convert to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=DataPengguna.xlsx",
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json({ error: "Gagal membuat file Excel" }, { status: 500 });
  }
}
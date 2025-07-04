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
    const mustahiqRecords = await prisma.mustahiq.findMany({
      include: {
        asnafs: {
          include: {
            asnaf: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mustahiq");

    // Define columns sesuai dengan gambar
    worksheet.columns = [
      { header: "ID PM", key: "id", width: 15 },
      { header: "Nama PM", key: "nama", width: 25 },
      { header: "Jenis Kelamin", key: "jenis_kelamin", width: 15 },
      { header: "Tgl Lahir", key: "tanggal_lahir", width: 15 },
      { header: "HP", key: "no_telepon", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Alamat", key: "alamat", width: 20 },
      { header: "Asnaf", key: "asnaf", width: 15 },
      { header: "Tgl Reg", key: "created_at", width: 15 },
      { header: "ID PJ", key: "id_pj", width: 15 },
    ];

    // Fill data
    for (const record of mustahiqRecords) {
      worksheet.addRow({
        id: record.id,
        nama: record.nama,
        jenis_kelamin: record.jenis_kelamin,
        tanggal_lahir: record.tanggal_lahir?.toISOString().split("T")[0] ?? "",
        no_telepon: record.no_telepon ?? "",
        email: record.email ?? "",
        alamat: record.alamat ?? "",
        asnaf: record.asnafs.map(a => a.asnaf?.type).join(", "),
        created_at: record.created_at ? record.created_at.toISOString().split("T")[0] : "",
        id_pj: record.created_by ?? "", 
      });
    }

    // Convert to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=DataMustahiq.xlsx",
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json({ error: "Gagal membuat file Excel" }, { status: 500 });
  }
}
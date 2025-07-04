import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

// Fungsi untuk validasi format tanggal
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  try {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return date;
    }
    
    if (typeof dateValue === 'number') {
      const date = xlsx.SSF.parse_date_code(dateValue);
      return new Date(date.y, date.m - 1, date.d);
    }
    
    return null;
  } catch {
    return null;
  }
}

// Fungsi untuk validasi kolom yang diperlukan
function validateRequiredColumns(data: any[]): string[] {
  const requiredColumns = ["ID PM", "Nama PM", "Jenis Kelamin", "Tgl Lahir", "HP", "Email", "Alamat", "Asnaf"];
  const missingColumns: string[] = [];
  
  if (data.length === 0) {
    return ["File kosong atau tidak memiliki data"];
  }
  
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  
  for (const column of requiredColumns) {
    if (!availableColumns.includes(column)) {
      missingColumns.push(column);
    }
  }
  
  return missingColumns;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      return NextResponse.json({ 
        message: "Unauthorized - Token tidak valid", 
        error: "UNAUTHORIZED" 
      }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ 
        message: "File tidak ditemukan", 
        error: "NO_FILE" 
      }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        message: "Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)", 
        error: "INVALID_FILE_TYPE" 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let workbook;
    try {
      workbook = xlsx.read(buffer);
    } catch (error) {
      return NextResponse.json({ 
        message: "File Excel tidak dapat dibaca atau rusak", 
        error: "CORRUPTED_FILE" 
      }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validasi kolom yang diperlukan
    const missingColumns = validateRequiredColumns(data);
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        message: `Format file tidak sesuai. Kolom yang diperlukan: ${missingColumns.join(", ")}`, 
        error: "INVALID_FORMAT",
        missingColumns 
      }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const item = data[i] as Record<string, any>;
        
        // Validasi data wajib
        if (!item["Nama PM"] || String(item["Nama PM"]).trim() === "") {
          errors.push(`Baris ${i + 2}: Nama PM tidak boleh kosong`);
          errorCount++;
          continue;
        }

        // Parse tanggal lahir
        const tanggalLahir = parseDate(item["Tgl Lahir"]);
        
        // Parse tanggal registrasi
        const tanggalRegistrasi = parseDate(item["Tgl Reg"]) || new Date();

        const mustahiq = await prisma.mustahiq.create({
          data: {
            nama: String(item["Nama PM"] || "").trim(),
            jenis_kelamin: String(item["Jenis Kelamin"] || "").trim(),
            tanggal_lahir: tanggalLahir,
            no_telepon: String(item["HP"] || "").trim(),
            email: String(item["Email"] || "").trim(),
            alamat: String(item["Alamat"] || "").trim(),
            status: "active",
            created_by: userId,
            created_at: tanggalRegistrasi,
          },
        });

        if (item["Asnaf"]) {
          const asnafTypes = String(item["Asnaf"]).split(",").map((t) => t.trim());
          for (const type of asnafTypes) {
            if (type) {
              const asnaf = await prisma.asnaf.findFirst({ where: { type } });
              if (asnaf) {
                await prisma.mustahiqAsnaf.create({
                  data: {
                    mustahiqId: mustahiq.id,
                    asnafId: asnaf.id,
                  },
                });
              }
            }
          }
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        errors.push(`Baris ${i + 2}: Gagal memproses data`);
        errorCount++;
      }
    }

    let statusCode = 200;
    let message = "";
    
    if (successCount === 0) {
      statusCode = 400;
      message = "Tidak ada data yang berhasil diimport";
    } else if (errorCount === 0) {
      statusCode = 200;
      message = `Import berhasil. ${successCount} data berhasil diimport`;
    } else {
      statusCode = 207;
      message = `Import selesai dengan hasil campuran. ${successCount} data berhasil diimport, ${errorCount} data gagal`;
    }

    return NextResponse.json({ 
      message, 
      success: successCount > 0,
      details: {
        totalProcessed: successCount + errorCount,
        successCount,
        errorCount,
        errors: errorCount > 0 ? errors.slice(0, 10) : []
      }
    }, { status: statusCode });

  } catch (error) {
    console.error("Error importing:", error);
    return NextResponse.json({ 
      message: "Terjadi kesalahan internal server", 
      error: "INTERNAL_SERVER_ERROR",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
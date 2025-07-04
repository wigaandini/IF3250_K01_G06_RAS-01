// app/api/penyaluran/import/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    
    if (!userId) {
      return NextResponse.json({ 
        message: "Unauthorized - Token tidak valid" 
      }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ 
        message: "File tidak ditemukan - Silakan upload file Excel" 
      }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return NextResponse.json({ 
        message: "Format file tidak valid - Gunakan file Excel (.xlsx atau .xls)" 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let workbook, data;
    try {
      workbook = xlsx.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(sheet);
    } catch (parseError) {
      return NextResponse.json({ 
        message: "File Excel tidak dapat dibaca - Pastikan file tidak corrupt" 
      }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        message: "File Excel kosong - Tidak ada data untuk diimport" 
      }, { status: 400 });
    }

    // Validasi kolom yang diperlukan
    const requiredColumns = ["ID PM", "ID Program", "COA Debet", "COA Kredit", "Nominal"];
    const firstRow = data[0] as Record<string, any>;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        message: `Format file tidak sesuai - Kolom yang hilang: ${missingColumns.join(", ")}. Pastikan file menggunakan template yang benar.` 
      }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Record<string, any>;
      
      try {
        // Validasi data required
        const idPM = item["ID PM"];
        const idProgram = item["ID Program"];
        const coaDebet = item["COA Debet"];
        const coaKredit = item["COA Kredit"];
        const nominal = item["Nominal"];

        if (!idPM || !idProgram || !coaDebet || !coaKredit || !nominal) {
          errors.push(`Baris ${i + 2}: Data tidak lengkap (ID PM, ID Program, COA Debet, COA Kredit, dan Nominal wajib diisi)`);
          errorCount++;
          continue;
        }

        // Validasi mustahiq exists
        const mustahiq = await prisma.mustahiq.findUnique({
          where: { id: parseInt(String(idPM)) }
        });
        if (!mustahiq) {
          errors.push(`Baris ${i + 2}: Mustahiq dengan ID ${idPM} tidak ditemukan`);
          errorCount++;
          continue;
        }

        // Validasi program exists
        const program = await prisma.program_Bantuan.findUnique({
          where: { id: parseInt(String(idProgram)) }
        });
        if (!program) {
          errors.push(`Baris ${i + 2}: Program dengan ID ${idProgram} tidak ditemukan`);
          errorCount++;
          continue;
        }

        // Validasi COA Debet exists
        const coaDebt = await prisma.coA.findUnique({
          where: { kode: String(coaDebet) }
        });
        if (!coaDebt) {
          errors.push(`Baris ${i + 2}: COA Debet dengan kode ${coaDebet} tidak ditemukan`);
          errorCount++;
          continue;
        }

        // Validasi COA Kredit exists
        const coaCred = await prisma.coA.findUnique({
          where: { kode: String(coaKredit) }
        });
        if (!coaCred) {
          errors.push(`Baris ${i + 2}: COA Kredit dengan kode ${coaKredit} tidak ditemukan`);
          errorCount++;
          continue;
        }

        // Validasi nominal adalah angka
        const nominalValue = parseFloat(String(nominal));
        if (isNaN(nominalValue) || nominalValue <= 0) {
          errors.push(`Baris ${i + 2}: Nominal harus berupa angka positif`);
          errorCount++;
          continue;
        }

        // Parse tanggal salur jika ada
        let tanggalSalur: Date | undefined;
        if (item["Tgl Salur"]) {
          try {
            tanggalSalur = new Date(item["Tgl Salur"]);
            if (isNaN(tanggalSalur.getTime())) {
              tanggalSalur = undefined;
            }
          } catch {
            tanggalSalur = undefined;
          }
        }

        // Create penyaluran
        await prisma.penyaluran.create({
          data: {
            mustahiq_id: parseInt(String(idPM)),
            program_id: parseInt(String(idProgram)),
            jumlah: Math.round(nominalValue),
            coa_debt_id: coaDebt.id,
            coa_cred_id: coaCred.id,
            catatan: String(item["Keterangan"] || ""),
            status: "active",
            created_by: userId,
            created_at: tanggalSalur || new Date(),
            tanggal: tanggalSalur || new Date(),
          },
        });

        successCount++;

      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errors.push(`Baris ${i + 2}: Gagal memproses data - ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    // Response berdasarkan hasil import
    if (successCount === 0) {
      return NextResponse.json({ 
        message: "Import gagal - Tidak ada data yang berhasil diimport",
        errors: errors.slice(0, 10), 
        summary: {
          total: data.length,
          success: successCount,
          failed: errorCount
        }
      }, { status: 400 });
    }

    if (errorCount > 0) {
      return NextResponse.json({ 
        message: `Import selesai dengan peringatan - ${successCount} berhasil, ${errorCount} gagal`,
        errors: errors.slice(0, 10), 
        summary: {
          total: data.length,
          success: successCount,
          failed: errorCount
        }
      }, { status: 207 }); 
    }

    return NextResponse.json({ 
      message: `Import berhasil - ${successCount} data penyaluran berhasil diimport`,
      summary: {
        total: data.length,
        success: successCount,
        failed: errorCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error importing penyaluran:", error);
    return NextResponse.json({ 
      message: "Internal Server Error - Terjadi kesalahan pada server saat memproses import",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
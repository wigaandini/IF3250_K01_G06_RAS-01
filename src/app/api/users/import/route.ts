import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

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
        message: "Akses ditolak - Token tidak valid atau sudah expired. Silakan login kembali." 
      }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ 
        message: "File tidak ditemukan - Silakan pilih dan upload file Excel yang berisi data pengguna" 
      }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return NextResponse.json({ 
        message: "Format file tidak didukung - Harap gunakan file Excel dengan ekstensi .xlsx atau .xls" 
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
        message: "File Excel rusak atau tidak dapat dibaca - Pastikan file tidak corrupt dan dapat dibuka di aplikasi Excel" 
      }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        message: "File Excel kosong - Tidak ditemukan data pengguna untuk diimport. Pastikan sheet pertama berisi data." 
      }, { status: 400 });
    }

    // Validasi kolom yang diperlukan sesuai format export
    const requiredColumns = ["Nama Pengguna", "Email", "No Telp", "Alamat", "Peran"];
    const firstRow = data[0] as Record<string, any>;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        message: `Format import tidak sesuai template - Kolom yang hilang: ${missingColumns.join(", ")}. Gunakan template export sebagai acuan format yang benar.` 
      }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const validRoles = ["superadmin", "amil", "relawan"];

    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Record<string, any>;
      
      try {
        const nama = item["Nama Pengguna"];
        const email = item["Email"];
        const noTelp = item["No Telp"];
        const alamat = item["Alamat"];
        const peran = item["Peran"];

        if (!nama || !email || !noTelp || !alamat || !peran) {
          errors.push(`Baris ${i + 2}: Data tidak lengkap - Nama Pengguna, Email, No Telp, Alamat, dan Peran wajib diisi`);
          errorCount++;
          continue;
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email))) {
          errors.push(`Baris ${i + 2}: Format email tidak valid - Gunakan format email yang benar (contoh: user@domain.com)`);
          errorCount++;
          continue;
        }

        // Validasi email unique
        const existingUser = await prisma.user.findUnique({
          where: { email: String(email) }
        });
        if (existingUser) {
          errors.push(`Baris ${i + 2}: Email sudah terdaftar - Email ${email} sudah digunakan pengguna lain`);
          errorCount++;
          continue;
        }

        // Validasi peran
        if (!validRoles.includes(String(peran).toLowerCase())) {
          errors.push(`Baris ${i + 2}: Peran tidak valid - Gunakan salah satu: ${validRoles.join(", ")}`);
          errorCount++;
          continue;
        }

        // Validasi nomor telepon (hanya angka dan karakter khusus)
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        if (!phoneRegex.test(String(noTelp))) {
          errors.push(`Baris ${i + 2}: Format nomor telepon tidak valid - Gunakan angka dan karakter khusus yang umum`);
          errorCount++;
          continue;
        }

        // Generate default password (bisa disesuaikan)
        const defaultPassword = "password123"; // Atau generate random password
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            nama: String(nama),
            email: String(email),
            password: hashedPassword,
            role: String(peran).toLowerCase(),
            alamat: String(alamat),
            no_telp: String(noTelp),
            created_at: new Date(),
          },
        });

        // Create role-specific record
        const roleData = { user_id: newUser.id, permissions: undefined };
        
        switch (String(peran).toLowerCase()) {
          case "superadmin":
            await prisma.superadmin.create({ data: roleData });
            break;
          case "amil":
            await prisma.amil.create({ data: roleData });
            break;
          case "relawan":
            await prisma.relawan.create({ data: roleData });
            break;
        }

        successCount++;

      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        
        // Handle specific Prisma errors
        if (rowError instanceof Error) {
          if (rowError.message.includes("Unique constraint")) {
            errors.push(`Baris ${i + 2}: Data duplikat - Email atau data unik lainnya sudah ada`);
          } else {
            errors.push(`Baris ${i + 2}: Gagal memproses data - ${rowError.message}`);
          }
        } else {
          errors.push(`Baris ${i + 2}: Terjadi kesalahan tidak dikenal saat memproses data`);
        }
        
        errorCount++;
      }
    }

    // Response berdasarkan hasil import
    if (successCount === 0) {
      return NextResponse.json({ 
        message: "Import gagal total - Tidak ada data pengguna yang berhasil diimport. Periksa format dan data yang diimport.",
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
        message: `Import selesai dengan peringatan - ${successCount} pengguna berhasil diimport, ${errorCount} gagal. Periksa detail error untuk perbaikan.`,
        errors: errors.slice(0, 10), 
        summary: {
          total: data.length,
          success: successCount,
          failed: errorCount
        }
      }, { status: 207 }); 
    }

    return NextResponse.json({ 
      message: `Import berhasil sempurna - ${successCount} data pengguna berhasil diimport. Password default untuk semua pengguna adalah "password123".`,
      summary: {
        total: data.length,
        success: successCount,
        failed: errorCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Critical error during user import:", error);
    
    // Handle different types of server errors
    if (error instanceof Error) {
      if (error.message.includes("database")) {
        return NextResponse.json({ 
          message: "Kesalahan database - Terjadi masalah koneksi atau operasi database. Coba lagi atau hubungi administrator.",
          error: "Database connection error"
        }, { status: 500 });
      } else if (error.message.includes("memory")) {
        return NextResponse.json({ 
          message: "Kesalahan memori - File terlalu besar atau sistem kehabisan memori. Coba dengan file yang lebih kecil.",
          error: "Memory allocation error"
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      message: "Kesalahan server internal - Terjadi kesalahan tak terduga pada server. Tim teknis telah diberitahu.",
      error: error instanceof Error ? error.message : "Unknown server error"
    }, { status: 500 });
  }
}
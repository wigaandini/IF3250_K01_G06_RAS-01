import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key");


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);


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

function getAllFilesFromFormData(formData: FormData, key: string): File[] {
  const files: File[] = [];
  const entries = formData.getAll(key);
  for (const entry of entries) {
    if (entry instanceof File && entry.name) {
      files.push(entry);
    }
  }
  return files;
}

async function uploadFileToSupabase(file: File, prefix: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filename = `${prefix}-${Date.now()}-${file.name}`;
  const path = `mustahiq/${filename}`;

  const { error } = await supabase.storage
    .from("mustahiqassets") // bucket name
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Gagal upload file: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("mustahiqassets")
    .getPublicUrl(path);

  return data.publicUrl;
}

// async function saveFile(file: File, prefix: string) {
//   const bytes = await file.arrayBuffer();
//   const buffer = Buffer.from(bytes);
  
//   const filename = `${prefix}-${Date.now()}-${file.name}`;
//   const path = join(process.cwd(), "public", "uploads", filename);
  
//   await writeFile(path, buffer);
//   return `/uploads/${filename}`;
// }

export async function GET() {
  const userId = await getUserIdFromToken();
  // console.log("User ID:", userId);

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
        creator: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // console.log("Fetched Records:", mustahiqRecords); 
    return NextResponse.json(mustahiqRecords, { status: 200 });
  } catch (error) {
    console.error('Error fetching mustahiq records:', error);
    return NextResponse.json({ error: "Gagal mengambil data mustahiq" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromToken();

  try {
    const formData = await req.formData();
    
    // console.log("Form data keys:", Array.from(formData.keys()));
    
    const foto_kk = formData.get('foto_kk') as File | null;
    const foto_ktp = formData.get('foto_ktp') as File | null;
    const foto_mustahiq = formData.get('foto_mustahiq') as File | null;

    // const foto_kk_path = foto_kk ? await saveFile(foto_kk, 'kk') : null;
    // const foto_ktp_path = foto_ktp ? await saveFile(foto_ktp, 'ktp') : null;
    // const foto_mustahiq_path = foto_mustahiq ? await saveFile(foto_mustahiq, 'mustahiq') : null;

    const foto_kk_path = foto_kk ? await uploadFileToSupabase(foto_kk, 'kk') : null;
    const foto_ktp_path = foto_ktp ? await uploadFileToSupabase(foto_ktp, 'ktp') : null;
    const foto_mustahiq_path = foto_mustahiq ? await uploadFileToSupabase(foto_mustahiq, 'mustahiq') : null;

    const asnafValue = formData.get('asnaf');
    console.log("Raw asnaf value:", asnafValue);

    let asnafIds: number[] = [];

    if (asnafValue) {
      try {
        const parsedValue = JSON.parse(String(asnafValue));
        
        if (Array.isArray(parsedValue)) {
          if (typeof parsedValue[0] === 'string') {
            const asnafRecords = await prisma.asnaf.findMany({
              where: { 
                type: { 
                  in: parsedValue 
                } 
              }
            });
            asnafIds = asnafRecords.map(record => record.id);
          } else {
            asnafIds = parsedValue.filter(id => !isNaN(Number(id))).map(id => Number(id));
          }
        }
      } catch (error) {
        console.error("Error parsing asnaf value:", error);
        asnafIds = String(asnafValue)
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));
      }
    }

    // console.log("Final parsed asnaf IDs:", asnafIds);

    if (asnafIds.length === 0) {
      const miskinAsnaf = await prisma.asnaf.findFirst({
        where: { type: "miskin" }
      });
      
      if (miskinAsnaf) {
        // console.log("Found fallback asnaf 'miskin' with ID:", miskinAsnaf.id);
        asnafIds = [miskinAsnaf.id];
      } else {
        console.error("No valid asnaf IDs provided and fallback not found");
        return NextResponse.json(
          { error: "Data asnaf tidak valid. Silakan pilih minimal satu kategori asnaf." }, 
          { status: 400 }
        );
      }
    }
    // const provinsi_id = formData.get('provinsi_id') ? Number(formData.get('provinsi_id')) : null;
    // const kabupaten_id = formData.get('kabupaten_id') ? Number(formData.get('kabupaten_id')) : null;
    // const kecamatan_id = formData.get('kecamatan_id') ? Number(formData.get('kecamatan_id')) : null;
    // const kelurahan_id = formData.get('kelurahan_id') ? Number(formData.get('kelurahan_id')) : null;
    const provinsi = formData.get('provinsi') as string;
    const kabupaten = formData.get('kabupaten') as string;
    const kecamatan = formData.get('kecamatan') as string;
    const kelurahan = formData.get('kelurahan') as string;
    const jumlah_anggota_kk = formData.get('jumlah_anggota_kk') ? Number(formData.get('jumlah_anggota_kk')) : null;
    
    const GPS_lat = formData.get('GPS_lat') ? parseFloat(formData.get('GPS_lat') as string) : null;
    const GPS_long = formData.get('GPS_long') ? parseFloat(formData.get('GPS_long') as string) : null;

    const mustahiqData = {
      NIK: formData.get('NIK') as string,
      nama: formData.get('nama') as string,
      jenis_kelamin: formData.get('jenis_kelamin') as string,
      tempat_lahir: formData.get('tempat_lahir') as string,
      tanggal_lahir: formData.get('tanggal_lahir') ? new Date(formData.get('tanggal_lahir') as string) : null,
      no_telepon: formData.get('no_telepon') as string,
      email: formData.get('email') as string,
      alamat: formData.get('alamat') as string,
      // provinsi_id,
      // kabupaten_id,
      // kecamatan_id,
      // kelurahan_id,
      provinsi,
      kabupaten,
      kecamatan,
      kelurahan,
      kode_pos: formData.get('kode_pos') as string,
      GPS_lat,
      GPS_long,
      status_pernikahan: formData.get('status_pernikahan') as string,
      pekerjaan: formData.get('pekerjaan') as string,
      agama: formData.get('agama') as string,
      pendidikan_terakhir: formData.get('pendidikan_terakhir') as string,
      jumlah_anggota_kk,
      foto_kk: foto_kk_path,
      foto_ktp: foto_ktp_path,
      foto_mustahiq: foto_mustahiq_path,
      created_by: userId,
      created_at: new Date(),
      status: 'active',
      
      asnafs: {
        create: asnafIds.map(asnafId => ({
          asnaf: {
            connect: { id: asnafId }
          }
        }))
      }
    };

    // console.log("Creating mustahiq with data:", {
    //   ...mustahiqData,
    //   asnafs: `Connecting ${asnafIds.length} asnaf records`
    // });

    const mustahiq = await prisma.mustahiq.create({
      data: mustahiqData,
      include: { 
        asnafs: { 
          include: { 
            asnaf: true 
          } 
        } 
      }
    });

    // const kondisiFiles = getAllFilesFromFormData(formData, 'foto_kondisi');

    // for (const file of kondisiFiles) {
    //   const filePath = await saveFile(file, 'kondisi');
    //   await prisma.mustahiqKondisiFoto.create({
    //     data: {
    //       mustahiq_id: mustahiq.id,
    //       url: filePath,
    //     },
    //   });
    // }
    const kondisiFiles = getAllFilesFromFormData(formData, 'foto_kondisi');
    for (const file of kondisiFiles) {
      const filePath = await uploadFileToSupabase(file, 'kondisi');
      await prisma.mustahiqKondisiFoto.create({
        data: {
          mustahiq_id: mustahiq.id,
          url: filePath,
        },
      });
    }

    // console.log("Successfully created mustahiq with ID:", mustahiq.id);
    return NextResponse.json({ success: true, data: mustahiq }, { status: 201 });
  } catch (error) {
    console.error('Error creating mustahiq:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: "Gagal membuat mustahiq", 
      details: errorMessage 
    }, { status: 500 });
  }
}
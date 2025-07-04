import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key");

async function verifyToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id: paramId } = params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const mustahiq = await prisma.mustahiq.findUnique({
      where: { id },
      include: {
        asnafs: { include: { asnaf: true } },
        creator: { select: { id: true, nama: true, email: true } },
        updater: { select: { id: true, nama: true, email: true } },
        bantuans: {
          include: {
            program: { select: { id: true, nama_program: true } }
          },
          orderBy: { tanggal: 'desc' }
        }
      },
    });

    if (!mustahiq) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const penyaluran_list = mustahiq.bantuans.map((b) => ({
      id: b.id,
      tanggal: b.tanggal?.toISOString() || null,
      jumlah: b.jumlah,
      status: b.status,
      program: b.program?.nama_program || "-"
    }));

    const transformedData = {
      id: mustahiq.id,
      NIK: mustahiq.NIK,
      nama: mustahiq.nama,
      jenis_kelamin: mustahiq.jenis_kelamin,
      tempat_lahir: mustahiq.tempat_lahir,
      tanggal_lahir: mustahiq.tanggal_lahir?.toISOString() || null,
      no_telepon: mustahiq.no_telepon,
      email: mustahiq.email,
      alamat: mustahiq.alamat,
      provinsi: mustahiq.provinsi,
      kabupaten: mustahiq.kabupaten,
      kecamatan: mustahiq.kecamatan,
      kelurahan: mustahiq.kelurahan,
      kode_pos: mustahiq.kode_pos,
      GPS_lat: mustahiq.GPS_lat,
      GPS_long: mustahiq.GPS_long,
      status_pernikahan: mustahiq.status_pernikahan,
      pekerjaan: mustahiq.pekerjaan,
      agama: mustahiq.agama,
      pendidikan_terakhir: mustahiq.pendidikan_terakhir,
      jumlah_anggota_kk: mustahiq.jumlah_anggota_kk,
      foto_kk: mustahiq.foto_kk,
      foto_ktp: mustahiq.foto_ktp,
      foto_mustahiq: mustahiq.foto_mustahiq,
      asnafs: mustahiq.asnafs.map(a => ({
        id: a.asnaf.id,
        type: a.asnaf.type
      })),
      created_by: mustahiq.creator,
      updated_by: mustahiq.updater,
      penyaluran_list
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyToken();
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const data: Record<string, any> = Object.fromEntries(formData.entries());
    console.log('Form Data:', data);
    const foto_ktp = formData.get('foto_ktp') as File;
    const foto_kk = formData.get('foto_kk') as File;
    const foto_mustahiq = formData.get('foto_mustahiq') as File;

    let fileUrls: Record<string, string | null> = {};
    
    if (foto_ktp && foto_ktp instanceof File && foto_ktp.size > 0) {
      fileUrls.foto_ktp = `/uploads/ktp/${id}_${Date.now()}.jpg`;
    }
    
    if (foto_kk && foto_kk instanceof File && foto_kk.size > 0) {
      fileUrls.foto_kk = `/uploads/kk/${id}_${Date.now()}.jpg`;
    }
    
    if (foto_mustahiq && foto_mustahiq instanceof File && foto_mustahiq.size > 0) {
      fileUrls.foto_mustahiq = `/uploads/mustahiq/${id}_${Date.now()}.jpg`;
    }

    console.log('Location data:', {
      provinsi: data.provinsi,
      kabupaten_kota: data.kabupaten_kota,
      kecamatan: data.kecamatan,
      desa_kelurahan: data.desa_kelurahan
    });

    const updatedData: Record<string, any> = {
      nama: data.nama as string,
      NIK: data.NIK as string,
      jenis_kelamin: data.jenis_kelamin as string,
      tempat_lahir: data.tempat_lahir as string,
      tanggal_lahir: data.tanggal_lahir ? new Date(data.tanggal_lahir as string) : undefined,
      no_telepon: data.no_telepon as string,
      email: data.email as string,
      alamat: data.alamat as string,
      provinsi: data.provinsi as string,
      kabupaten: data.kabupaten_kota as string,
      kecamatan: data.kecamatan as string,
      kelurahan: data.desa_kelurahan as string,
      kode_pos: data.kode_pos as string,
      GPS_lat: data.GPS_lat ? parseFloat(data.GPS_lat as string) : null,
      GPS_long: data.GPS_long ? parseFloat(data.GPS_long as string) : null,
      status_pernikahan: data.status_pernikahan as string,
      pekerjaan: data.pekerjaan as string,
      agama: data.agama as string,
      pendidikan_terakhir: data.pendidikan_terakhir as string,
      jumlah_anggota_kk: data.jumlah_anggota_kk ? parseInt(data.jumlah_anggota_kk as string) : null,
      updated_by: (auth as any).id,
      updated_at: new Date(),
      ...fileUrls
    };

    // Handle 'asnaf' field - parse and save the multiple asnaf types
    if (data.asnaf) {
      const asnafs = Array.isArray(data.asnaf) 
        ? data.asnaf 
        : JSON.parse(data.asnaf as string || '[]');
      
      await prisma.mustahiqAsnaf.deleteMany({ where: { mustahiqId: id } });
    
      for (const asnafType of asnafs) {
        const asnaf = await prisma.asnaf.findUnique({
          where: { type: asnafType }
        });
        if (asnaf) {
          await prisma.mustahiqAsnaf.create({
            data: {
              mustahiqId: id,
              asnafId: asnaf.id,
            },
          });
        }
      }
    }

    // Update Mustahiq data
    const mustahiq = await prisma.mustahiq.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json({ 
      success: true, 
      data: mustahiq 
    });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: "Failed to update data" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await verifyToken();
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: (auth as any).id },
    select: { role: true }
  });

  if (!['amil', 'superadmin'].includes(user?.role || '')) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // First delete related records
    await prisma.mustahiqAsnaf.deleteMany({
      where: { mustahiqId: id }
    });

    await prisma.mustahiqKondisiFoto.deleteMany({
      where: { mustahiq_id: id }
    });

    await prisma.mustahiqProgram.deleteMany({
      where: { mustahiqId: id }
    });

    await prisma.parameterFieldValue.deleteMany({
      where: { mustahiq_id: id }
    });

    // Then delete the mustahiq
    await prisma.mustahiq.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Mustahiq deleted successfully"
    });
  } catch (error: any) {
    console.error('DELETE Error:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Cannot delete mustahiq because it's referenced in other records" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to delete data",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
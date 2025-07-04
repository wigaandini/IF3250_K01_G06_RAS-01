import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET /api/map-data
export async function GET() {
  try {
    // Fetch all Penyaluran with status 'delivered'
    const penyaluran = await prisma.penyaluran.findMany({
      where: {
        status: 'delivered'
      },
      include: {
        mustahiq: {
          select: {
            id: true,
            nama: true,
            GPS_lat: true,
            GPS_long: true,
            alamat: true
          }
        },
        program: {
          select: {
            nama_program: true
          }
        }
      }
    });

    // Filter out mustahiq without GPS coordinates
    const filteredData = penyaluran.filter(
      (item) => item.mustahiq?.GPS_lat && item.mustahiq.GPS_long
    );

    // Transform data for the map
    const mapData = filteredData.map((item) => ({
      id: item.id,
      mustahiqId: item.mustahiq_id,
      nama: item.mustahiq?.nama,
      alamat: item.mustahiq?.alamat,
      program: item.program?.nama_program,
      tanggal: item.tanggal,
      jumlah: item.jumlah,
      lat: item.mustahiq?.GPS_lat ? parseFloat(item.mustahiq.GPS_lat.toString()) : null,
      lng: item.mustahiq?.GPS_long ? parseFloat(item.mustahiq.GPS_long.toString()) : null
    }));

    return NextResponse.json(mapData);
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
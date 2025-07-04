// app/api/program/[id]/parameters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/program/[id]/parameters
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  const programId = parseInt(resolvedParams.id);

  if (isNaN(programId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const parameters = await prisma.parameterField.findMany({
      where: { program_id: programId },
      orderBy: { id: "asc" },
    });

    const sumberDanaList = await prisma.programSumberDana.findMany({
      where: { program_id: programId },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      parameterFields: parameters,
      sumber_dana_list: sumberDanaList,
    });
  } catch (error) {
    console.error("GET parameters error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

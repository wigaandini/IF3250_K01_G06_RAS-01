-- AlterTable
ALTER TABLE "Program_Bantuan" ALTER COLUMN "bidang_kategori" SET DEFAULT 'pendidikan',
ALTER COLUMN "kepala_program" SET DEFAULT '1',
ALTER COLUMN "sumber_dana" SET DEFAULT 'infak',
ALTER COLUMN "unit_penyalur" SET DEFAULT 'pusat';

-- CreateTable
CREATE TABLE "ParameterField" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "description" TEXT,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "ParameterField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParameterField_program_id_idx" ON "ParameterField"("program_id");

-- AddForeignKey
ALTER TABLE "ParameterField" ADD CONSTRAINT "ParameterField_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program_Bantuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

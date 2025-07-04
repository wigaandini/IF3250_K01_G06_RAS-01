/*
  Warnings:

  - You are about to drop the `Bantuan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bantuan" DROP CONSTRAINT "Bantuan_created_by_fkey";

-- DropForeignKey
ALTER TABLE "Bantuan" DROP CONSTRAINT "Bantuan_lokasi_id_fkey";

-- DropForeignKey
ALTER TABLE "Bantuan" DROP CONSTRAINT "Bantuan_mustahiq_id_fkey";

-- DropForeignKey
ALTER TABLE "Bantuan" DROP CONSTRAINT "Bantuan_program_id_fkey";

-- DropTable
DROP TABLE "Bantuan";

-- CreateTable
CREATE TABLE "Penyaluran" (
    "id" SERIAL NOT NULL,
    "mustahiq_id" INTEGER,
    "program_id" INTEGER,
    "lokasi_id" INTEGER,
    "tanggal" DATE,
    "jumlah" INTEGER,
    "bukti_penyaluran" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMPTZ,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ,
    "status" TEXT,

    CONSTRAINT "Penyaluran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Penyaluran_mustahiq_id_program_id_idx" ON "Penyaluran"("mustahiq_id", "program_id");

-- CreateIndex
CREATE INDEX "Penyaluran_tanggal_idx" ON "Penyaluran"("tanggal");

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_mustahiq_id_fkey" FOREIGN KEY ("mustahiq_id") REFERENCES "Mustahiq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program_Bantuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "Lokasi_Bantuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

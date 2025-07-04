/*
  Warnings:

  - You are about to drop the column `sumber_dana` on the `Program_Bantuan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Program_Bantuan" DROP COLUMN "sumber_dana";

-- CreateTable
CREATE TABLE "ProgramSumberDana" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "sumber_dana" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "catatan_sumber_dana" TEXT,

    CONSTRAINT "ProgramSumberDana_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramSumberDana_program_id_idx" ON "ProgramSumberDana"("program_id");

-- AddForeignKey
ALTER TABLE "ProgramSumberDana" ADD CONSTRAINT "ProgramSumberDana_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program_Bantuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

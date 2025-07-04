/*
  Warnings:

  - The `kepala_program` column on the `Program_Bantuan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Program_Bantuan" DROP COLUMN "kepala_program",
ADD COLUMN     "kepala_program" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ParameterFieldValue" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "field_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "ParameterFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParameterFieldValue_program_id_field_id_idx" ON "ParameterFieldValue"("program_id", "field_id");

-- AddForeignKey
ALTER TABLE "ParameterFieldValue" ADD CONSTRAINT "ParameterFieldValue_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program_Bantuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterFieldValue" ADD CONSTRAINT "ParameterFieldValue_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "ParameterField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

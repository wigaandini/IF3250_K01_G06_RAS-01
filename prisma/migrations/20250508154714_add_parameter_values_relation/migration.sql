/*
  Warnings:

  - Made the column `penyaluran_id` on table `ParameterFieldValue` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ParameterFieldValue" DROP CONSTRAINT "ParameterFieldValue_penyaluran_id_fkey";

-- AlterTable
ALTER TABLE "ParameterFieldValue" ALTER COLUMN "penyaluran_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ParameterFieldValue" ADD CONSTRAINT "ParameterFieldValue_penyaluran_id_fkey" FOREIGN KEY ("penyaluran_id") REFERENCES "Penyaluran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

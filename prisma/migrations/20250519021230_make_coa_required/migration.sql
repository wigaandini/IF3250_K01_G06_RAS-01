/*
  Warnings:

  - Made the column `coa_id` on table `Penyaluran` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Penyaluran" DROP CONSTRAINT "Penyaluran_coa_id_fkey";

-- AlterTable
ALTER TABLE "Penyaluran" ALTER COLUMN "coa_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "CoA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

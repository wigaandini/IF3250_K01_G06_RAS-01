/*
  Warnings:

  - You are about to drop the column `coa_id` on the `Penyaluran` table. All the data in the column will be lost.
  - Added the required column `coa_cred_id` to the `Penyaluran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coa_debt_id` to the `Penyaluran` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Penyaluran" DROP CONSTRAINT "Penyaluran_coa_id_fkey";

-- AlterTable
ALTER TABLE "Penyaluran" DROP COLUMN "coa_id",
ADD COLUMN     "coa_cred_id" INTEGER NOT NULL,
ADD COLUMN     "coa_debt_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_coa_debt_id_fkey" FOREIGN KEY ("coa_debt_id") REFERENCES "CoA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_coa_cred_id_fkey" FOREIGN KEY ("coa_cred_id") REFERENCES "CoA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

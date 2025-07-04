/*
  Warnings:

  - You are about to drop the column `penyalur` on the `Program_Bantuan` table. All the data in the column will be lost.
  - Added the required column `bidang_kategori` to the `Program_Bantuan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kepala_program` to the `Program_Bantuan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sumber_dana` to the `Program_Bantuan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_penyalur` to the `Program_Bantuan` table without a default value. This is not possible if the table is not empty.
  - Made the column `nama_program` on table `Program_Bantuan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Program_Bantuan" DROP COLUMN "penyalur",
ADD COLUMN     "bidang_kategori" TEXT NOT NULL,
ADD COLUMN     "catatan_mitra" TEXT,
ADD COLUMN     "kategori_mitra" TEXT,
ADD COLUMN     "kepala_program" TEXT NOT NULL,
ADD COLUMN     "nama_mitra" TEXT,
ADD COLUMN     "sumber_dana" TEXT NOT NULL,
ADD COLUMN     "unit_penyalur" TEXT NOT NULL,
ALTER COLUMN "nama_program" SET NOT NULL;

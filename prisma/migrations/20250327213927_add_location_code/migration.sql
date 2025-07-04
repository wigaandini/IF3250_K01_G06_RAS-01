/*
  Warnings:

  - A unique constraint covering the columns `[kode]` on the table `Kabupaten` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kode]` on the table `Kecamatan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kode]` on the table `Kelurahan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kode]` on the table `Provinsi` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode` to the `Kabupaten` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode` to the `Kecamatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode` to the `Kelurahan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kode` to the `Provinsi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Kabupaten" ADD COLUMN     "kode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Kecamatan" ADD COLUMN     "kode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Kelurahan" ADD COLUMN     "kode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Provinsi" ADD COLUMN     "kode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Kabupaten_kode_key" ON "Kabupaten"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kecamatan_kode_key" ON "Kecamatan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kelurahan_kode_key" ON "Kelurahan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Provinsi_kode_key" ON "Provinsi"("kode");

/*
  Warnings:

  - You are about to drop the column `kabupaten_id` on the `Mustahiq` table. All the data in the column will be lost.
  - You are about to drop the column `kecamatan_id` on the `Mustahiq` table. All the data in the column will be lost.
  - You are about to drop the column `kelurahan_id` on the `Mustahiq` table. All the data in the column will be lost.
  - You are about to drop the column `provinsi_id` on the `Mustahiq` table. All the data in the column will be lost.
  - You are about to drop the `Kabupaten` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kecamatan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kelurahan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Provinsi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Kabupaten" DROP CONSTRAINT "Kabupaten_provinsi_id_fkey";

-- DropForeignKey
ALTER TABLE "Kecamatan" DROP CONSTRAINT "Kecamatan_kabupaten_id_fkey";

-- DropForeignKey
ALTER TABLE "Kelurahan" DROP CONSTRAINT "Kelurahan_kecamatan_id_fkey";

-- DropForeignKey
ALTER TABLE "Mustahiq" DROP CONSTRAINT "Mustahiq_kabupaten_id_fkey";

-- DropForeignKey
ALTER TABLE "Mustahiq" DROP CONSTRAINT "Mustahiq_kecamatan_id_fkey";

-- DropForeignKey
ALTER TABLE "Mustahiq" DROP CONSTRAINT "Mustahiq_kelurahan_id_fkey";

-- DropForeignKey
ALTER TABLE "Mustahiq" DROP CONSTRAINT "Mustahiq_provinsi_id_fkey";

-- AlterTable
ALTER TABLE "Mustahiq" DROP COLUMN "kabupaten_id",
DROP COLUMN "kecamatan_id",
DROP COLUMN "kelurahan_id",
DROP COLUMN "provinsi_id",
ADD COLUMN     "kabupaten" TEXT,
ADD COLUMN     "kecamatan" TEXT,
ADD COLUMN     "kelurahan" TEXT,
ADD COLUMN     "provinsi" TEXT;

-- DropTable
DROP TABLE "Kabupaten";

-- DropTable
DROP TABLE "Kecamatan";

-- DropTable
DROP TABLE "Kelurahan";

-- DropTable
DROP TABLE "Provinsi";

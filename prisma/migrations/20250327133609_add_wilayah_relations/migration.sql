/*
  Warnings:

  - You are about to drop the column `kabupaten` on the `Mustahiq` table. All the data in the column will be lost.
  - You are about to drop the column `kecamatan` on the `Mustahiq` table. All the data in the column will be lost.
  - You are about to drop the column `provinsi` on the `Mustahiq` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mustahiq" DROP COLUMN "kabupaten",
DROP COLUMN "kecamatan",
DROP COLUMN "provinsi",
ADD COLUMN     "kabupaten_id" INTEGER,
ADD COLUMN     "kecamatan_id" INTEGER,
ADD COLUMN     "kelurahan_id" INTEGER,
ADD COLUMN     "provinsi_id" INTEGER;

-- CreateTable
CREATE TABLE "Provinsi" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Provinsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kabupaten" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "provinsi_id" INTEGER NOT NULL,

    CONSTRAINT "Kabupaten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kecamatan" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kabupaten_id" INTEGER NOT NULL,

    CONSTRAINT "Kecamatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelurahan" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kecamatan_id" INTEGER NOT NULL,

    CONSTRAINT "Kelurahan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Kabupaten" ADD CONSTRAINT "Kabupaten_provinsi_id_fkey" FOREIGN KEY ("provinsi_id") REFERENCES "Provinsi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kecamatan" ADD CONSTRAINT "Kecamatan_kabupaten_id_fkey" FOREIGN KEY ("kabupaten_id") REFERENCES "Kabupaten"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelurahan" ADD CONSTRAINT "Kelurahan_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "Kecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahiq" ADD CONSTRAINT "Mustahiq_provinsi_id_fkey" FOREIGN KEY ("provinsi_id") REFERENCES "Provinsi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahiq" ADD CONSTRAINT "Mustahiq_kabupaten_id_fkey" FOREIGN KEY ("kabupaten_id") REFERENCES "Kabupaten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahiq" ADD CONSTRAINT "Mustahiq_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "Kecamatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahiq" ADD CONSTRAINT "Mustahiq_kelurahan_id_fkey" FOREIGN KEY ("kelurahan_id") REFERENCES "Kelurahan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

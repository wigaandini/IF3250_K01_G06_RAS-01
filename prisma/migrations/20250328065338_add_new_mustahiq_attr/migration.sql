/*
  Warnings:

  - You are about to drop the column `foto` on the `Mustahiq` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mustahiq" DROP COLUMN "foto",
ADD COLUMN     "agama" TEXT,
ADD COLUMN     "asnaf" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "foto_kk" TEXT,
ADD COLUMN     "foto_ktp" TEXT,
ADD COLUMN     "foto_mustahiq" TEXT,
ADD COLUMN     "jenis_kelamin" TEXT,
ADD COLUMN     "jumlah_anggota_kk" INTEGER,
ADD COLUMN     "pekerjaan" TEXT,
ADD COLUMN     "pendidikan_terakhir" TEXT,
ADD COLUMN     "status_pernikahan" TEXT,
ADD COLUMN     "tanggal_lahir" TIMESTAMP(3),
ADD COLUMN     "tempat_lahir" TEXT;

-- DropForeignKey
ALTER TABLE "Kabupaten" DROP CONSTRAINT "Kabupaten_provinsi_id_fkey";

-- DropForeignKey
ALTER TABLE "Kecamatan" DROP CONSTRAINT "Kecamatan_kabupaten_id_fkey";

-- DropForeignKey
ALTER TABLE "Kelurahan" DROP CONSTRAINT "Kelurahan_kecamatan_id_fkey";

-- AddForeignKey
ALTER TABLE "Kabupaten" ADD CONSTRAINT "Kabupaten_provinsi_id_fkey" FOREIGN KEY ("provinsi_id") REFERENCES "Provinsi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kecamatan" ADD CONSTRAINT "Kecamatan_kabupaten_id_fkey" FOREIGN KEY ("kabupaten_id") REFERENCES "Kabupaten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelurahan" ADD CONSTRAINT "Kelurahan_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "Kecamatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

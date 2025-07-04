-- AlterTable
ALTER TABLE "ParameterFieldValue" ADD COLUMN     "penyaluran_id" INTEGER;

-- AddForeignKey
ALTER TABLE "ParameterFieldValue" ADD CONSTRAINT "ParameterFieldValue_mustahiq_id_fkey" FOREIGN KEY ("mustahiq_id") REFERENCES "Mustahiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterFieldValue" ADD CONSTRAINT "ParameterFieldValue_penyaluran_id_fkey" FOREIGN KEY ("penyaluran_id") REFERENCES "Penyaluran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

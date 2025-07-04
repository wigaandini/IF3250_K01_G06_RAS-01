-- AlterTable
ALTER TABLE "Penyaluran" ADD COLUMN     "updated_by" INTEGER,
ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

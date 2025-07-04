-- AlterTable
ALTER TABLE "Penyaluran" ADD COLUMN     "coa_id" INTEGER;

-- CreateTable
CREATE TABLE "CoA" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "jenis_transaksi" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "CoA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoA_kode_key" ON "CoA"("kode");

-- AddForeignKey
ALTER TABLE "Penyaluran" ADD CONSTRAINT "Penyaluran_coa_id_fkey" FOREIGN KEY ("coa_id") REFERENCES "CoA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

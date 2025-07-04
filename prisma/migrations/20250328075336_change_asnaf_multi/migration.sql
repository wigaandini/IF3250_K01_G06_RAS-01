/*
  Warnings:

  - You are about to drop the column `asnaf` on the `Mustahiq` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mustahiq" DROP COLUMN "asnaf";

-- CreateTable
CREATE TABLE "Asnaf" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Asnaf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MustahiqAsnaf" (
    "mustahiqId" INTEGER NOT NULL,
    "asnafId" INTEGER NOT NULL,

    CONSTRAINT "MustahiqAsnaf_pkey" PRIMARY KEY ("mustahiqId","asnafId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asnaf_type_key" ON "Asnaf"("type");

-- AddForeignKey
ALTER TABLE "MustahiqAsnaf" ADD CONSTRAINT "MustahiqAsnaf_mustahiqId_fkey" FOREIGN KEY ("mustahiqId") REFERENCES "Mustahiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MustahiqAsnaf" ADD CONSTRAINT "MustahiqAsnaf_asnafId_fkey" FOREIGN KEY ("asnafId") REFERENCES "Asnaf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

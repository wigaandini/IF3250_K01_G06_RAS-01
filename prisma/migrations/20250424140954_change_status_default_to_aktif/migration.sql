/*
  Warnings:

  - Made the column `status` on table `Program_Bantuan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kepala_program` on table `Program_Bantuan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Program_Bantuan" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Aktif',
ALTER COLUMN "kepala_program" SET NOT NULL;

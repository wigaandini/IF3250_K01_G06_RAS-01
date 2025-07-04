/*
  Warnings:

  - Added the required column `mustahiq_id` to the `ParameterFieldValue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ParameterFieldValue" ADD COLUMN     "mustahiq_id" INTEGER NOT NULL;

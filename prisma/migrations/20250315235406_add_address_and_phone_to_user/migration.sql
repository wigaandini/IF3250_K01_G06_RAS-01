/*
  Warnings:

  - Made the column `alamat` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `no_telp` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "alamat" SET NOT NULL,
ALTER COLUMN "no_telp" SET NOT NULL;

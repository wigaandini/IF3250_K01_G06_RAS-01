-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nama" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT,
    "alamat" TEXT,
    "no_telp" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Superadmin" (
    "user_id" INTEGER NOT NULL,
    "permissions" JSONB,

    CONSTRAINT "Superadmin_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Amil" (
    "user_id" INTEGER NOT NULL,
    "permissions" JSONB,

    CONSTRAINT "Amil_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Relawan" (
    "user_id" INTEGER NOT NULL,
    "permissions" JSONB,

    CONSTRAINT "Relawan_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Mustahiq" (
    "id" SERIAL NOT NULL,
    "NIK" TEXT NOT NULL,
    "nama" TEXT,
    "alamat" TEXT,
    "kecamatan" TEXT,
    "kabupaten" TEXT,
    "provinsi" TEXT,
    "kode_pos" TEXT,
    "no_telepon" TEXT,
    "GPS_lat" DOUBLE PRECISION,
    "GPS_long" DOUBLE PRECISION,
    "foto" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMPTZ,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ,
    "updated_by" INTEGER,

    CONSTRAINT "Mustahiq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program_Bantuan" (
    "id" SERIAL NOT NULL,
    "nama_program" TEXT,
    "deskripsi" TEXT,
    "kriteria" TEXT,
    "jumlah_bantuan" INTEGER,
    "penyalur" TEXT,
    "tanggal_mulai" DATE,
    "tanggal_selesai" DATE,
    "status" TEXT,
    "created_at" TIMESTAMPTZ,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "Program_Bantuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bantuan" (
    "id" SERIAL NOT NULL,
    "mustahiq_id" INTEGER,
    "program_id" INTEGER,
    "lokasi_id" INTEGER,
    "tanggal" DATE,
    "jumlah" INTEGER,
    "bukti_penyaluran" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMPTZ,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ,
    "status" TEXT,

    CONSTRAINT "Bantuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Riwayat_Bantuan" (
    "id" SERIAL NOT NULL,
    "mustahiq_id" INTEGER,
    "program_id" INTEGER,
    "lokasi_id" INTEGER,
    "tanggal" DATE,
    "jumlah" INTEGER,
    "status" TEXT,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "Riwayat_Bantuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lokasi_Bantuan" (
    "id" SERIAL NOT NULL,
    "nama_lokasi" TEXT,
    "alamat" TEXT,
    "tipe" TEXT,
    "deskripsi" TEXT,
    "GPS_lat" DOUBLE PRECISION,
    "GPS_long" DOUBLE PRECISION,
    "foto" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMPTZ,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "Lokasi_Bantuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity_Log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT,
    "table_name" TEXT,
    "record_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMPTZ,

    CONSTRAINT "Activity_Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dashboard_Settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "settings" JSONB,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "Dashboard_Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Mustahiq_NIK_key" ON "Mustahiq"("NIK");

-- CreateIndex
CREATE INDEX "mustahiq_coords" ON "Mustahiq"("GPS_lat", "GPS_long");

-- CreateIndex
CREATE INDEX "Program_Bantuan_nama_program_idx" ON "Program_Bantuan"("nama_program");

-- CreateIndex
CREATE INDEX "Bantuan_mustahiq_id_program_id_idx" ON "Bantuan"("mustahiq_id", "program_id");

-- CreateIndex
CREATE INDEX "Bantuan_tanggal_idx" ON "Bantuan"("tanggal");

-- CreateIndex
CREATE INDEX "Riwayat_Bantuan_mustahiq_id_program_id_idx" ON "Riwayat_Bantuan"("mustahiq_id", "program_id");

-- CreateIndex
CREATE INDEX "Riwayat_Bantuan_tanggal_idx" ON "Riwayat_Bantuan"("tanggal");

-- CreateIndex
CREATE INDEX "location_coords" ON "Lokasi_Bantuan"("GPS_lat", "GPS_long");

-- CreateIndex
CREATE INDEX "Lokasi_Bantuan_tipe_idx" ON "Lokasi_Bantuan"("tipe");

-- CreateIndex
CREATE INDEX "Activity_Log_user_id_idx" ON "Activity_Log"("user_id");

-- CreateIndex
CREATE INDEX "Activity_Log_table_name_record_id_idx" ON "Activity_Log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "Activity_Log_timestamp_idx" ON "Activity_Log"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Dashboard_Settings_user_id_key" ON "Dashboard_Settings"("user_id");

-- AddForeignKey
ALTER TABLE "Superadmin" ADD CONSTRAINT "Superadmin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amil" ADD CONSTRAINT "Amil_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relawan" ADD CONSTRAINT "Relawan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahiq" ADD CONSTRAINT "Mustahiq_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahiq" ADD CONSTRAINT "Mustahiq_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program_Bantuan" ADD CONSTRAINT "Program_Bantuan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bantuan" ADD CONSTRAINT "Bantuan_mustahiq_id_fkey" FOREIGN KEY ("mustahiq_id") REFERENCES "Mustahiq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bantuan" ADD CONSTRAINT "Bantuan_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program_Bantuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bantuan" ADD CONSTRAINT "Bantuan_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "Lokasi_Bantuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bantuan" ADD CONSTRAINT "Bantuan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat_Bantuan" ADD CONSTRAINT "Riwayat_Bantuan_mustahiq_id_fkey" FOREIGN KEY ("mustahiq_id") REFERENCES "Mustahiq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat_Bantuan" ADD CONSTRAINT "Riwayat_Bantuan_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program_Bantuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat_Bantuan" ADD CONSTRAINT "Riwayat_Bantuan_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "Lokasi_Bantuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lokasi_Bantuan" ADD CONSTRAINT "Lokasi_Bantuan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity_Log" ADD CONSTRAINT "Activity_Log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard_Settings" ADD CONSTRAINT "Dashboard_Settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

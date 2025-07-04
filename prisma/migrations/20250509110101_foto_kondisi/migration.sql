-- CreateTable
CREATE TABLE "MustahiqKondisiFoto" (
    "id" SERIAL NOT NULL,
    "mustahiq_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MustahiqKondisiFoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MustahiqKondisiFoto" ADD CONSTRAINT "MustahiqKondisiFoto_mustahiq_id_fkey" FOREIGN KEY ("mustahiq_id") REFERENCES "Mustahiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MustahiqProgram" (
    "mustahiqId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,

    CONSTRAINT "MustahiqProgram_pkey" PRIMARY KEY ("mustahiqId","programId")
);

-- AddForeignKey
ALTER TABLE "MustahiqProgram" ADD CONSTRAINT "MustahiqProgram_mustahiqId_fkey" FOREIGN KEY ("mustahiqId") REFERENCES "Mustahiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MustahiqProgram" ADD CONSTRAINT "MustahiqProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program_Bantuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

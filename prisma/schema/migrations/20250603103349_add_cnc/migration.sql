-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "cnc_id" TEXT;

-- CreateTable
CREATE TABLE "cncs" (
    "id" TEXT NOT NULL,
    "regionCNC" TEXT,
    "numeroAuto" TEXT,
    "nom" TEXT,
    "adresse" TEXT,
    "commune" TEXT,
    "dep" TEXT,
    "ecrans" INTEGER,
    "fauteuils" INTEGER,
    "semainesActivite" INTEGER,
    "seances" INTEGER,
    "entrees2023" INTEGER,
    "entrees2022" INTEGER,
    "evolutionEntrees" DOUBLE PRECISION,
    "trancheEntrees" TEXT,
    "genre" TEXT,
    "multiplexe" BOOLEAN,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cncs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_cnc_id_fkey" FOREIGN KEY ("cnc_id") REFERENCES "cncs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

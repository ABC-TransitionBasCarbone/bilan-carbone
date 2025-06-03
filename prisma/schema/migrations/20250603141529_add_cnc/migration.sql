-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "cnc_id" TEXT;

-- CreateTable
CREATE TABLE "cncs" (
    "id" TEXT NOT NULL,
    "region_cnc" TEXT,
    "numero_auto" TEXT,
    "nom" TEXT,
    "adresse" TEXT,
    "code_insee" TEXT,
    "commune" TEXT,
    "dep" TEXT,
    "ecrans" INTEGER,
    "fauteuils" INTEGER,
    "semaines_activite" INTEGER,
    "seances" INTEGER,
    "entrees2023" INTEGER,
    "entrees2022" INTEGER,
    "evolution_entrees" DOUBLE PRECISION,
    "tranche_entrees" TEXT,
    "genre" TEXT,
    "multiplexe" BOOLEAN,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cncs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cncs_numero_auto_key" ON "cncs"("numero_auto");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_cnc_id_fkey" FOREIGN KEY ("cnc_id") REFERENCES "cncs"("numero_auto") ON DELETE SET NULL ON UPDATE CASCADE;

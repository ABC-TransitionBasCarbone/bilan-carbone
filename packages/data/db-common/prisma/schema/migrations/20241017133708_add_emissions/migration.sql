-- CreateEnum
CREATE TYPE "Import" AS ENUM ('BaseEmpreinte', 'Manual');

-- CreateEnum
CREATE TYPE "EmissionType" AS ENUM ('Post', 'Element');

-- CreateEnum
CREATE TYPE "EmissionStatus" AS ENUM ('Archived', 'Valid');

-- CreateTable
CREATE TABLE "emissions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imported_from" "Import" NOT NULL,
    "imported_id" TEXT,
    "type" "EmissionType" NOT NULL,
    "status" "EmissionStatus" NOT NULL,
    "source" TEXT,
    "location" TEXT NOT NULL,
    "post" TEXT,
    "incertitude" INTEGER,
    "technical_representativeness" DOUBLE PRECISION,
    "geographic_representativeness" DOUBLE PRECISION,
    "temporal_representativeness" DOUBLE PRECISION,
    "completeness" DOUBLE PRECISION,
    "total_co2" DOUBLE PRECISION NOT NULL,
    "co2f" DOUBLE PRECISION,
    "ch4f" DOUBLE PRECISION,
    "ch4b" DOUBLE PRECISION,
    "n2o" DOUBLE PRECISION,
    "co2b" DOUBLE PRECISION,
    "other_ges" DOUBLE PRECISION,

    CONSTRAINT "emissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_metadata" (
    "emission_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT,
    "attribute" TEXT,
    "frontiere" TEXT,
    "tag" TEXT,
    "unit" TEXT,
    "location" TEXT,
    "comment" TEXT,
    "post" TEXT,

    CONSTRAINT "emission_metadata_pkey" PRIMARY KEY ("emission_id","language")
);

-- AddForeignKey
ALTER TABLE "emission_metadata" ADD CONSTRAINT "emission_metadata_emission_id_fkey" FOREIGN KEY ("emission_id") REFERENCES "emissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

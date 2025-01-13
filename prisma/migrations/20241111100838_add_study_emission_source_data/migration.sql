-- CreateEnum
CREATE TYPE "EmissionSourceType" AS ENUM ('Physical', 'Accounting', 'Extrapolated', 'Statistical', 'Approched');

-- AlterTable
ALTER TABLE "study_emission_sources" ADD COLUMN     "caracterisation" TEXT,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "completeness" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_limite" DATE,
ADD COLUMN     "emission_id" TEXT,
ADD COLUMN     "geographic_representativeness" INTEGER,
ADD COLUMN     "reliability" INTEGER,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "tag" TEXT,
ADD COLUMN     "technical_representativeness" INTEGER,
ADD COLUMN     "temporal_representativeness" INTEGER,
ADD COLUMN     "type" "EmissionSourceType",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "validated" BOOLEAN,
ADD COLUMN     "value" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_emission_id_fkey" FOREIGN KEY ("emission_id") REFERENCES "emissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

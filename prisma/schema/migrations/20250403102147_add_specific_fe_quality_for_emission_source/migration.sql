-- AlterTable
ALTER TABLE "study_emission_sources" ADD COLUMN     "fe_completeness" INTEGER,
ADD COLUMN     "fe_geographic_representativeness" INTEGER,
ADD COLUMN     "fe_reliability" INTEGER,
ADD COLUMN     "fe_technical_representativeness" INTEGER,
ADD COLUMN     "fe_temporal_representativeness" INTEGER;

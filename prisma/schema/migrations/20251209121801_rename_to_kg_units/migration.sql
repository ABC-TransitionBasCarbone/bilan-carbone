-- Rename Action.reductionValue to reductionValueKg and convert from tonnes to kg
ALTER TABLE "actions" RENAME COLUMN "reduction_value" TO "reduction_value_kg";
UPDATE "actions" SET "reduction_value_kg" = "reduction_value_kg" * 1000 WHERE "reduction_value_kg" IS NOT NULL;

-- Rename ExternalStudy.totalCo2 to totalCo2Kg and convert from tonnes to kg
ALTER TABLE "external_studies" RENAME COLUMN "total_co2" TO "total_co2_kg";
UPDATE "external_studies" SET "total_co2_kg" = "total_co2_kg" * 1000 WHERE "total_co2_kg" IS NOT NULL;

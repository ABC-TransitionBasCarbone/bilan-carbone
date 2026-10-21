-- CreateEnum
CREATE TYPE "EmissionFactorBase" AS ENUM ('LocationBased', 'MarketBased');

ALTER TABLE "emission_factors" ADD COLUMN     "base" "EmissionFactorBase";
UPDATE emission_factors SET base = 'LocationBased' WHERE sub_posts @> ARRAY['Electricite']::"SubPost"[];

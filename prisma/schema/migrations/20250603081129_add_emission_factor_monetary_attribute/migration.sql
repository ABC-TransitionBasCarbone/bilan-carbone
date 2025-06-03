-- AlterTable
ALTER TABLE "emission_factors" ADD COLUMN     "is_monetary" BOOLEAN NOT NULL DEFAULT false;

UPDATE "emission_factors" SET is_monetary=true WHERE unit in ('CNY', 'DOLLAR','EURO', 'JPY');

ALTER TABLE "emission_factors" ALTER COLUMN "is_monetary" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factors" ADD COLUMN     "is_monetary" BOOLEAN NOT NULL DEFAULT false;

UPDATE "emission_factors" SET is_monetary=true WHERE unit in ('CNY', 'DOLLAR','EURO', 'JPY', 'KEURO', 'KEURO_2019_HT', 'KEURO_2020_HT', 'KEURO_2021_HT', 'KEURO_2022_HT', 'KEURO_2023_HT', 'EURO_SPENT', 'FRANC_CFP');

ALTER TABLE "emission_factors" ALTER COLUMN "is_monetary" DROP DEFAULT;

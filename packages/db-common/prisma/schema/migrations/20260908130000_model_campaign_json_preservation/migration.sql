ALTER TABLE "mip"."model_campaigns"
ALTER COLUMN "model" TYPE JSON
USING "model"::JSON;

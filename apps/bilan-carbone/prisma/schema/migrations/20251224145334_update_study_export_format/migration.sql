-- AlterTable
ALTER TABLE "study_exports" ADD COLUMN     "id" TEXT,
ADD COLUMN     "types" "Export"[] DEFAULT ARRAY[]::"Export"[];

-- Add id
UPDATE study_exports SET id = gen_random_uuid();

-- Add values into "types" column
UPDATE study_exports SET types = ARRAY[type] WHERE type IS NOT NULL;

-- Finish table transformation
ALTER TABLE "study_exports" DROP CONSTRAINT "study_exports_pkey",
DROP COLUMN "type",
ALTER COLUMN "id" SET NOT NULL,
ALTER COLUMN "control" DROP NOT NULL,
ADD CONSTRAINT "study_exports_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "study_exports_study_id_key" ON "study_exports"("study_id");

-- CreateTable
CREATE TABLE "action_steps" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_steps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_steps" ADD CONSTRAINT "action_steps_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing subSteps data to action_steps table
INSERT INTO "action_steps" ("id", "action_id", "title", "order", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    "id" as "action_id",
    "sub_steps" as "title",
    0 as "order",
    CURRENT_TIMESTAMP as "created_at",
    CURRENT_TIMESTAMP as "updated_at"
FROM "actions"
WHERE "sub_steps" IS NOT NULL AND "sub_steps" != '';

-- Make sub_steps column optional (nullable)
ALTER TABLE "actions" ALTER COLUMN "sub_steps" DROP NOT NULL;

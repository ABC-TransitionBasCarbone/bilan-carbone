-- CreateEnum
CREATE TYPE "CRUserChecklist" AS ENUM ('CreateAccount', 'AddCollaborator', 'AddClient', 'AddSite', 'CreateFirstStudy', 'CreateFirstEmissionSource', 'ConsultResults', 'Completed');

-- CreateTable
CREATE TABLE "user_checked_steps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "step" "CRUserChecklist" NOT NULL,

    CONSTRAINT "user_checked_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_checked_steps_user_id_step_key" ON "user_checked_steps"("user_id", "step");

-- Insérer une ligne dans user_checked_steps pour chaque utilisateur actif
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO user_checked_steps (id, user_id, step)
SELECT gen_random_uuid(), id, 'CreateAccount'
FROM users
WHERE status = 'ACTIVE'
ON CONFLICT (user_id, step) DO NOTHING;

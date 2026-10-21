/*
  Warnings:

  - You are about to drop the column `status` on the `users` table. All the data in the column will be lost.
  - Added the required column `status` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE accounts ADD COLUMN "status" "UserStatus";

UPDATE accounts SET "status" = (SELECT users.status FROM users WHERE accounts.user_id = users.id) WHERE "status" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM accounts JOIN users ON user_id = users.id WHERE accounts.status IS DISTINCT FROM users.status) THEN
      RAISE EXCEPTION 'ERREUR : les status ne sont pas identiques entre les tables accounts et users';
  END IF;
END$$;

ALTER TABLE accounts ALTER COLUMN "status" SET NOT NULL;
-- AlterTable
ALTER TABLE users DROP COLUMN "status";

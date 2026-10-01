-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mip";

-- CreateTable
CREATE TABLE "mip"."accounts_mip" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "accounts_mip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mip"."accounts_mip" ADD CONSTRAINT "accounts_mip_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

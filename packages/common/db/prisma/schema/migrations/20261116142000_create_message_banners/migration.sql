CREATE TABLE "bilan_carbone"."message_banners" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "environments" "common"."Environment"[] NOT NULL DEFAULT ARRAY[]::"common"."Environment"[],
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_banners_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'VALIDATED');

-- CreateTable
CREATE TABLE "StudyComment" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "validated_by_account_id" TEXT,
    "author_account_id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "sub_post" "SubPost",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudyComment" ADD CONSTRAINT "StudyComment_validated_by_account_id_fkey" FOREIGN KEY ("validated_by_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyComment" ADD CONSTRAINT "StudyComment_author_account_id_fkey" FOREIGN KEY ("author_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyComment" ADD CONSTRAINT "StudyComment_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

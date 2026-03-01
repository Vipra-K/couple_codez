-- CreateEnum
CREATE TYPE "ChatBackgroundType" AS ENUM ('COLOR', 'GRADIENT', 'IMAGE');

-- AlterTable
ALTER TABLE "Couple" ADD COLUMN     "themeTemplateId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePic" TEXT;

-- CreateTable
CREATE TABLE "ThemeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundType" "ChatBackgroundType" NOT NULL,
    "backgroundColor" TEXT,
    "gradientStartColor" TEXT,
    "gradientEndColor" TEXT,
    "gradientAngle" INTEGER,
    "backgroundImageUrl" TEXT,
    "senderBubbleColor" TEXT NOT NULL,
    "receiverBubbleColor" TEXT NOT NULL,
    "senderTextColor" TEXT NOT NULL,
    "receiverTextColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemeTemplate_name_key" ON "ThemeTemplate"("name");

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_themeTemplateId_fkey" FOREIGN KEY ("themeTemplateId") REFERENCES "ThemeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

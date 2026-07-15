-- AlterTable: Add timezone setting
ALTER TABLE "SiteSetting" ADD COLUMN "timezone" TEXT DEFAULT 'Asia/Shanghai';

-- AlterTable: Add head and footer custom code fields
ALTER TABLE "SiteSetting" ADD COLUMN "headCode" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "footerCode" TEXT;

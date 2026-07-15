-- AlterTable: Add receiver info field for express delivery
ALTER TABLE "Order" ADD COLUMN "receiverInfo" TEXT;

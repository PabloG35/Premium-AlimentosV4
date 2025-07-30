/*
  Warnings:

  - A unique constraint covering the columns `[preferenceId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "preferenceId" TEXT,
ALTER COLUMN "externalId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_preferenceId_key" ON "Payment"("preferenceId");

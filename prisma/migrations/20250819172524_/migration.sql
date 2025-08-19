/*
  Warnings:

  - Added the required column `documentId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `File` ADD COLUMN `documentId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

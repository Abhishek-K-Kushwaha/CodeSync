-- AlterTable
ALTER TABLE "Room" ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("roomCode");

-- DropIndex
DROP INDEX "Room_roomCode_key";

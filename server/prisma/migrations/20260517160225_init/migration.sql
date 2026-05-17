-- CreateTable
CREATE TABLE "Room" (
    "roomCode" TEXT NOT NULL,
    "passcode" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'cpp',
    "code" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomCode_key" ON "Room"("roomCode");

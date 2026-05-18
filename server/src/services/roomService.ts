import prisma from "../lib/prisma";

export const getRoom = async (roomId: string) => {
  return await prisma.room.findUnique({
    where: { roomCode: roomId },
  });
};

export const createRoom = async (roomId: string, passcode: string) => {
  return await prisma.room.create({
    data: {
      roomCode: roomId,
      passcode,
      code: "",
      language: "cpp",
    },
  });
};

export const updateCode = async (roomId: string, code: string) => {
  return await prisma.room.update({
    where: { roomCode: roomId },
    data: { code },
  });
};

export const updateLanguage = async (roomId: string, language: string) => {
  return await prisma.room.update({
    where: { roomCode: roomId },
    data: { language },
  });
};
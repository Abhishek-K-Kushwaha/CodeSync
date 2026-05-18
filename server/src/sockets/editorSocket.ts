import { Server, Socket } from "socket.io";
import { rooms } from "../store/roomStore";
import { User } from "../types/room";
import { executeCode } from "../utils/executeCode";
import * as roomService from "../services/roomService";

const socketRoomMap: Record<string, string> = {};

const getConnectedUsers = (roomId: string) => {
  return rooms[roomId]?.users || [];
};

export const registerEditorSocketHandlers = (
  io: Server,
  socket: Socket
) => {
  console.log("User connected:", socket.id);

  const joinRoom = (roomId: string, username: string) => {
    socket.join(roomId);

    socketRoomMap[socket.id] = roomId;
    
    const user: User = { socketId: socket.id, username };
    rooms[roomId].users.push(user);

    console.log(`${username} (${socket.id}) joined ${roomId}`);

    socket.emit("sync-code", rooms[roomId].code || "");
    socket.emit("sync-language", rooms[roomId].language || "cpp");
    socket.emit("room-joined");

    // Broadcast the updated user list to everyone in the room
    io.to(roomId).emit("users-update", getConnectedUsers(roomId));
  };

  socket.on("create-room", async ({ roomId, passcode, username }: { roomId: string; passcode: string; username: string }) => {
    if (rooms[roomId]) {
      socket.emit("room-error", "Room already exists.");
      return;
    }

    try {
      const existingRoom = await roomService.getRoom(roomId);

      if (existingRoom) {
        socket.emit("room-error", "Room already exists.");
        return;
      }

      await roomService.createRoom(roomId, passcode);

      rooms[roomId] = {
        roomId,
        passcode,
        users: [],
        code: "",
        language: "cpp",
      };
      joinRoom(roomId, username);
    } catch (err) {
      console.error("Failed to create room:", err);
      socket.emit("room-error", "Failed to create room.");
    }
  });

  socket.on("join-room", async ({ roomId, passcode, username }: { roomId: string; passcode: string; username: string }) => {
    if (!rooms[roomId]) {
      try {
        const dbRoom = await roomService.getRoom(roomId);

        if (!dbRoom) {
          socket.emit("room-error", "Room does not exist.");
          return;
        }

        rooms[roomId] = {
          roomId: dbRoom.roomCode,
          passcode: dbRoom.passcode,
          users: [],
          code: dbRoom.code,
          language: dbRoom.language,
        };
      } catch (err) {
        console.error("Failed to load room from DB:", err);
        socket.emit("room-error", "Failed to join room.");
        return;
      }
    }
    if (rooms[roomId].passcode !== passcode) {
      socket.emit("room-error", "Invalid passcode.");
      return;
    }
    joinRoom(roomId, username);
  });

  socket.on("code-change", async ({ roomId, code }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
      socket.to(roomId).emit("code-update", code);

      try {
        await roomService.updateCode(roomId, code);
      } catch (err) {
        console.error("Failed to persist code change:", err);
      }
    }
  });

  socket.on("language-change", async ({ roomId, language }) => {
    if (rooms[roomId]) {
      rooms[roomId].language = language;
      socket.to(roomId).emit("language-update", language);

      try {
        await roomService.updateLanguage(roomId, language);
      } catch (err) {
        console.error("Failed to persist language change:", err);
      }
    }
  });

  socket.on("execute-code", async ({ code, language }) => {
    try {
      socket.emit("execution-started");
      const output = await executeCode(language, code);
      socket.emit("execution-output", output);
    } catch (err: any) {
      socket.emit("execution-output", err.message || "Execution failed");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const roomId = socketRoomMap[socket.id];
    if (roomId && rooms[roomId]) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId !== socket.id);
      delete socketRoomMap[socket.id];
      io.to(roomId).emit("users-update", getConnectedUsers(roomId));
      
      // Cleanup room if empty
      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
      }
    }
  });
};
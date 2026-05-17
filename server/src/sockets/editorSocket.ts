import { Server, Socket } from "socket.io";
import { rooms } from "../store/roomStore";
import { User } from "../types/room";

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
    socket.emit("room-joined");

    // Broadcast the updated user list to everyone in the room
    io.to(roomId).emit("users-update", getConnectedUsers(roomId));
  };

  socket.on("create-room", ({ roomId, passcode, username }: { roomId: string; passcode: string; username: string }) => {
    if (rooms[roomId]) {
      socket.emit("room-error", "Room already exists.");
      return;
    }
    rooms[roomId] = {
      roomId,
      passcode,
      users: [],
      code: "",
    };
    joinRoom(roomId, username);
  });

  socket.on("join-room", ({ roomId, passcode, username }: { roomId: string; passcode: string; username: string }) => {
    if (!rooms[roomId]) {
      socket.emit("room-error", "Room does not exist.");
      return;
    }
    if (rooms[roomId].passcode !== passcode) {
      socket.emit("room-error", "Invalid passcode.");
      return;
    }
    joinRoom(roomId, username);
  });

  socket.on("code-change", ({ roomId, code }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
      socket.to(roomId).emit("code-update", code);
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
import { Server, Socket } from "socket.io";
import { roomCode } from "../store/roomStore";

const socketRoomMap: Record<string, string> = {};
const userSocketMap: Record<string, string> = {};
const roomPasscodes: Record<string, string> = {};

const getConnectedUsers = (roomId: string, io: Server) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    })
  );
};

export const registerEditorSocketHandlers = (
  io: Server,
  socket: Socket
) => {
  console.log("User connected:", socket.id);

  const joinRoom = (roomId: string, username: string) => {
    socket.join(roomId);

    socketRoomMap[socket.id] = roomId;
    userSocketMap[socket.id] = username;

    console.log(`${username} (${socket.id}) joined ${roomId}`);

    socket.emit("sync-code", roomCode[roomId] || "");
    socket.emit("room-joined");

    // Broadcast the updated user list to everyone in the room
    io.to(roomId).emit("users-update", getConnectedUsers(roomId, io));
  };

  socket.on("create-room", ({ roomId, passcode, username }: { roomId: string; passcode: string; username: string }) => {
    if (roomPasscodes[roomId]) {
      socket.emit("room-error", "Room already exists.");
      return;
    }
    roomPasscodes[roomId] = passcode;
    joinRoom(roomId, username);
  });

  socket.on("join-room", ({ roomId, passcode, username }: { roomId: string; passcode: string; username: string }) => {
    if (!roomPasscodes[roomId]) {
      socket.emit("room-error", "Room does not exist.");
      return;
    }
    if (roomPasscodes[roomId] !== passcode) {
      socket.emit("room-error", "Invalid passcode.");
      return;
    }
    joinRoom(roomId, username);
  });

  socket.on("code-change", ({ roomId, code }) => {
    roomCode[roomId] = code;

    socket.to(roomId).emit("code-update", code);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const roomId = socketRoomMap[socket.id];
    if (roomId) {
      delete userSocketMap[socket.id];
      delete socketRoomMap[socket.id];
      io.to(roomId).emit("users-update", getConnectedUsers(roomId, io));
      
      // Cleanup room if empty
      const connectedUsers = getConnectedUsers(roomId, io);
      if (connectedUsers.length === 0) {
        delete roomPasscodes[roomId];
        delete roomCode[roomId];
      }
    }
  });
};
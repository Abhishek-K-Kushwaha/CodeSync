import { Server, Socket } from "socket.io";
import { roomCode } from "../store/roomStore";

export const registerEditorSocketHandlers = (
  io: Server,
  socket: Socket
) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);

    console.log(`${socket.id} joined ${roomId}`);

    socket.emit("sync-code", roomCode[roomId] || "");

    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("code-change", ({ roomId, code }) => {
    roomCode[roomId] = code;

    socket.to(roomId).emit("code-update", code);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
};
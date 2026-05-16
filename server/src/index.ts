import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import { registerEditorSocketHandlers } from "./sockets/editorSocket";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (_, res) => {
  res.send("Server running");
});

io.on("connection", (socket) => {
  registerEditorSocketHandlers(io, socket);
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
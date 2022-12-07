import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import express from "express";

const app = express();
app.use(express.json())
const SOCKET_PORT = 3003
const API_PORT = 3004
const io = new Server({
  cors:  {
    origin: ["http://localhost:3000"]
  }
});

(async () => {
  const pubClient = createClient({ url: '' });
  await pubClient.connect();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  io.listen(SOCKET_PORT);
})();

console.log(`[SOCKET SERVER]: running at https://localhost:${SOCKET_PORT}`);

io.on("connection", (socket) => {
    socket.on("joinRoom", ({ username, room }) => {
      const welcomeMessage = `[SERVER TO CLIENT] Welcome ${username} at room ${room} !`;
      console.log(welcomeMessage);
      socket.join(room);
      socket.emit("roomUsers", { room });
      io.of("/").to(room).emit("roomUsers", { room });
    });

    socket.on("disconnect", () => {
      console.log("🚀  USER DISCONNECTED ", socket.id, socket.rooms)
    });
  
    // Listen for feedbackMessage
    socket.on("feedbackMessage", (msg) => {
      console.log("🚀 ~ Receiving message from client", msg, socket.id, socket.rooms);
    });

    io.of("/").adapter.on("create-room", (room) => {
      console.log(`room ${room} was created`);
    });
    
    io.of("/").adapter.on("join-room", (room, id) => {
      console.log(`socket ${id} has joined room ${room}`);
    });
});

app.post('/send-to-client', (req, res) => {
  const { gasPump, user, cnpj } = req.body
  console.log("🚀  SEND TO THE CLIENT ", { gasPump, user, cnpj })

  io.of("/").to(`preset-${cnpj}`).emit("message", { gasPump, user, cnpj, date: new Date().toString() });

  res.send('OK')
});

app.listen(API_PORT, () => console.log(`[SERVER API]: running at https://localhost:${API_PORT}`));

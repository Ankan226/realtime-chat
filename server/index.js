import express from "express";
import http from "http";
import cors from "cors";
import { randomUUID } from "crypto";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:3000"
).split(",");

const ROOMS = ["General", "Tech Support"];
const MAX_HISTORY = 50;


const history = Object.fromEntries(ROOMS.map((r) => [r, []]));

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));

app.get("/", (req, res) => res.send("Chat server is running"));
app.get("/health", (req, res) => res.json({ status: "ok" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

const systemMessage = (room, text) => ({
  id: randomUUID(),
  room,
  system: true,
  text,
  time: new Date().toISOString(),
});

function isUsernameTaken(name, currentSocketId) {
  for (const [id, s] of io.sockets.sockets) {
    if (
      id !== currentSocketId &&
      s.data.username &&
      s.data.username.toLowerCase() === name.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);


  socket.on("join_room", ({ username, room } = {}, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const name = String(username || "").trim().slice(0, 20);

    if (!name) return reply({ ok: false, error: "Username is required" });
    if (!ROOMS.includes(room)) return reply({ ok: false, error: "Invalid room" });
    if (isUsernameTaken(name, socket.id)) {
      return reply({ ok: false, error: "That username is already taken" });
    }

    const prevRoom = socket.data.room;

    if (prevRoom === room && socket.data.username === name) {
      return reply({ ok: true, history: history[room] });
    }

  
    if (prevRoom) {
      socket.leave(prevRoom);
      socket.to(prevRoom).emit("user_typing", { username: socket.data.username, isTyping: false });
      socket.to(prevRoom).emit(
        "system_message",
        systemMessage(prevRoom, `${socket.data.username} left the room`)
      );
    }

    socket.data.username = name;
    socket.data.room = room;
    socket.join(room);

    console.log(`[join] ${name} -> ${room}`);
    reply({ ok: true, history: history[room] });
    socket.to(room).emit("system_message", systemMessage(room, `${name} joined the room`));
  });


  socket.on("send_message", (text) => {
    const { username, room } = socket.data;
    if (!username || !room) return;

    const clean = String(text || "").trim().slice(0, 500);
    if (!clean) return;

    const message = {
      id: randomUUID(),
      room,
      username,
      text: clean,
      time: new Date().toISOString(),
    };

    history[room].push(message);
    if (history[room].length > MAX_HISTORY) history[room].shift();

    io.to(room).emit("receive_message", message); 
  });

  
  socket.on("typing", (isTyping) => {
    const { username, room } = socket.data;
    if (!username || !room) return;
    socket.to(room).emit("user_typing", { username, isTyping: Boolean(isTyping) });
  });

  socket.on("disconnect", () => {
    const { username, room } = socket.data;
    console.log(`[disconnect] ${socket.id}`);
    if (username && room) {
      socket.to(room).emit("user_typing", { username, isTyping: false });
      socket.to(room).emit("system_message", systemMessage(room, `${username} disconnected`));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
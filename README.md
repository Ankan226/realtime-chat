<h1 align="center">Realtime Chat</h1>

<p align="center">
  A real-time, multi-room chat application built with <b>Node.js, Express, Socket.io and React</b>.<br/>
  Sprint 12 · Track B (Fullstack) · WebSockets &amp; Real-Time Bidirectional Data Pipelines
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

---

## Live Demo

| | Link |
|---|---|
| Live app (client) | `https://YOUR-APP.vercel.app` |
| Server (API) | `https://YOUR-SERVER.onrender.com` |

> The server runs on a free tier and may sleep when idle. The first load can take 30-60 seconds.

---

## Screenshots

### Join screen
Users must choose a unique username and a room before connecting.

![Join screen](docs/screenshots/01-join-screen.png)

### Duplicate username protection
The server rejects a username that is already in use.

![Duplicate username error](docs/screenshots/02-duplicate-username.png)

### Live bidirectional chat
Messages are sent to the server and instantly broadcast back to everyone in the room, formatted as `[Name]: message`.

![Live chat](docs/screenshots/03-live-chat.png)

### Typing indicator
A keyboard event on the client emits a `typing` event, and the server relays it so other users see "Nakul is typing...".

![Typing indicator](docs/screenshots/04-typing-indicator.png)

### Room isolation
Messages in **General** never reach users in **Tech Support**, and the reverse.

![Room isolation](docs/screenshots/05-room-isolation.png)

### Server handshake logs
The server logs every successful client handshake and room join.

<img width="368" height="225" alt="image" src="https://github.com/user-attachments/assets/a43e64a7-21a0-4d0c-8fe9-06013f073e0a" />


---

## Features

**Phase 1: WebSocket base**
- Socket.io server on Node/Express that logs each client handshake
- Persistent `socket.io-client` connection from the React app
- Instant server-to-client broadcast of every message

**Phase 2: Session identity and events**
- Unique username required before connecting (duplicates rejected, case-insensitive)
- Messages rendered as `[Nakul]: Hello world!`
- Keyboard-driven typing indicator shown on all other clients in the room

**Phase 3: Channels and routing**
- Two isolated rooms: **General** and **Tech Support**
- UI room selector on the join screen and in the chat header
- Messages are broadcast **only** to clients subscribed to that room

**Extras**
- Last 50 messages per room, so late joiners see recent history
- Join, leave and disconnect notices
- Automatic re-join after a network reconnect
- Connection status indicator (connected / reconnecting)
- Input limits: usernames up to 20 characters, messages up to 500 characters
- Configurable CORS through an environment variable

---


## How It Works

```
┌────────────────┐   WebSocket (Socket.io)   ┌────────────────────┐
│  React client  │ <───────────────────────> │  Node/Express      │
│  (Vite, :5173) │                           │  + Socket.io (:5000)│
└────────────────┘                           └────────────────────┘
        │                                             │
   join_room  ───────────────────────────────>  validates name + room
   send_message ─────────────────────────────>  io.to(room).emit(...)
   typing ───────────────────────────────────>  socket.to(room).emit(...)
        <─────── receive_message / user_typing / system_message
```

Key design decisions:
- **One shared socket** lives in `client/src/socket.js`, outside React, with `autoConnect: false`. It only connects after the user joins, and React 18 StrictMode cannot create duplicate connections.
- **Listener cleanup** in `useEffect` removes every handler on unmount, which prevents duplicate messages.
- **Rooms** use Socket.io's built-in `socket.join(room)` and `io.to(room).emit(...)`, so isolation is enforced on the server rather than filtered in the browser.
- **Acknowledgements**: `join_room` uses a callback, so the client learns immediately whether the join succeeded and receives the room history.


---

## Getting Started

### Prerequisites
- Node.js 18 or newer
- npm

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/realtime-chat.git
cd realtime-chat
```

### 2. Start the server
```bash
cd server
npm install
npm run dev
```
The server runs on `http://localhost:5000`.

### 3. Start the client (new terminal)
```bash
cd client
npm install
npm run dev
```
The client runs on `http://localhost:5173`.

### 4. Try it
Open `http://localhost:5173` in **two different browser windows** (for example one normal and one incognito), join with different usernames, and start chatting.

---

## Socket Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `connection` | client → server | none | Handshake, logged as `[connect] <id>` |
| `join_room` | client → server | `{ username, room }` + ack | Joins a room. The ack returns `{ ok, history }` or `{ ok: false, error }` |
| `send_message` | client → server | `string` | Sends a message to the user's current room |
| `receive_message` | server → room | `{ id, room, username, text, time }` | Delivers a chat message to that room only |
| `typing` | client → server | `boolean` | Reports whether the user is typing |
| `user_typing` | server → room | `{ username, isTyping }` | Shows or hides the typing indicator for others |
| `system_message` | server → room | `{ id, room, system, text, time }` | Join, leave and disconnect notices |
| `disconnect` | client → server | none | Cleans up and notifies the room |

---

## How to Test

1. Open two windows side by side at `http://localhost:5173`.
2. **Identity:** join as `Nakul` in one window, then try `Nakul` in the other. You should see an error. Join as `Riya` instead.
3. **Broadcast:** send messages from each window and confirm they appear instantly in both.
4. **Typing:** start typing in one window without sending. The other shows "X is typing..." and it clears after about 1.5 seconds of inactivity.
5. **Rooms:** switch Riya to **Tech Support** and send a message from Nakul in **General**. Riya must not receive it.
6. **History:** switch Riya back to General and confirm she sees the recent messages.
7. **Logs:** check the server terminal for `[connect]`, `[join]` and `[disconnect]` lines.

---

## Deployment

**Server (Render)**
1. New → Web Service, connect the repo.
2. Root Directory: `server`. Build Command: `npm install`. Start Command: `npm start`.
3. Environment variable: `CLIENT_ORIGIN` = your Vercel URL.

**Client (Vercel)**
1. Add New → Project, import the repo.
2. Root Directory: `client`. Framework: Vite.
3. Environment variable: `VITE_SERVER_URL` = your Render URL (no trailing slash).

`VITE_SERVER_URL` is baked in at build time, so redeploy the client after changing it.

---


---

## AI Usage

AI assistance was used for parts of this project. The prompt strategy, the issues encountered and how they were resolved are documented in [Prompts.md](./Prompts.md).

---

## Author

**Ankan Pal**
- GitHub: https://github.com/Ankan226/realtime-chat

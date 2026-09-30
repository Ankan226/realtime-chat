import { useState } from "react";
import { socket } from "./socket";
import JoinScreen from "./components/JoinScreen.jsx";
import ChatRoom from "./components/ChatRoom.jsx";

export default function App() {
  const [session, setSession] = useState(null); // { username, room }
  const [error, setError] = useState("");

  const handleJoin = (username, room) => {
    setError("");
    socket.connect();
    setSession({ username, room });
  };

  const handleChangeRoom = (room) => {
    setSession((prev) => ({ ...prev, room }));
  };

  const handleLeave = (message = "") => {
    socket.disconnect();
    setSession(null);
    setError(message);
  };

  return session ? (
    <ChatRoom
      username={session.username}
      room={session.room}
      onChangeRoom={handleChangeRoom}
      onLeave={handleLeave}
    />
  ) : (
    <JoinScreen onJoin={handleJoin} error={error} />
  );
}
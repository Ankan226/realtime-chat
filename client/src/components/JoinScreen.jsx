import { useState } from "react";
import { ROOMS } from "../socket";

export default function JoinScreen({ onJoin, error }) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(ROOMS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    onJoin(name, room);
  };

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Realtime Chat</h1>
        <p className="muted">Pick a unique name and a room to get started.</p>

        {error && <div className="error">{error}</div>}

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. Nakul"
          maxLength={20}
          autoFocus
        />

        <label>Room</label>
        <select value={room} onChange={(e) => setRoom(e.target.value)}>
          {ROOMS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button type="submit" disabled={!username.trim()}>
          Join Chat
        </button>
      </form>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { socket, ROOMS } from "../socket";

const IGNORED_KEYS = [
  "Enter",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "Tab",
  "Escape",
  "CapsLock",
];

export default function ChatRoom({ username, room, onChangeRoom, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(socket.connected);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);


  useEffect(() => {
    setMessages([]);
    setTypingUsers([]);
    isTypingRef.current = false;

    const join = () => {
      socket.emit("join_room", { username, room }, (res) => {
        if (res?.ok) {
          setMessages(res.history || []);
        } else {
          onLeave(res?.error || "Could not join the room");
        }
      });
    };

    const onConnect = () => {
      setConnected(true);
      join(); 
    };
    const onDisconnect = () => setConnected(false);

    const onMessage = (msg) => {
      if (msg.room === room) setMessages((prev) => [...prev, msg]);
    };

    const onTyping = ({ username: who, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping
          ? prev.includes(who)
            ? prev
            : [...prev, who]
          : prev.filter((u) => u !== who)
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive_message", onMessage);
    socket.on("system_message", onMessage);
    socket.on("user_typing", onTyping);

    if (socket.connected) join();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive_message", onMessage);
      socket.off("system_message", onMessage);
      socket.off("user_typing", onTyping);
      clearTimeout(typingTimeout.current);
    };
  
  }, [username, room]);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const stopTyping = () => {
    clearTimeout(typingTimeout.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("typing", false);
    }
  };


  const handleKeyDown = (e) => {
    if (IGNORED_KEYS.includes(e.key)) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", true);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 1500);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    if (!value) stopTyping(); 
  };

  const handleSend = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    socket.emit("send_message", clean);
    setText("");
    stopTyping();
  };

  const typingLabel =
    typingUsers.length === 0
      ? ""
      : typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.join(", ")} are typing...`;

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="chat">
      <header className="chat-header">
        <div>
          <strong>{room}</strong>
          <span className={connected ? "dot online" : "dot offline"} />
          <span className="muted small">
            {connected ? "connected" : "reconnecting..."} - you are {username}
          </span>
        </div>
        <div className="header-actions">
          <select value={room} onChange={(e) => onChangeRoom(e.target.value)}>
            {ROOMS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button className="secondary" onClick={() => onLeave("")}>
            Leave
          </button>
        </div>
      </header>

      <main className="messages">
        {messages.length === 0 && (
          <p className="muted center-text">No messages yet. Say hello!</p>
        )}

        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="system">
              {m.text}
            </div>
          ) : (
            <div
              key={m.id}
              className={m.username === username ? "msg mine" : "msg"}
            >
              <span className="msg-text">
                <strong>[{m.username}]:</strong> {m.text}
              </span>
              <span className="msg-time">{formatTime(m.time)}</span>
            </div>
          )
        )}

        <div className="typing">{typingLabel}</div>
        <div ref={bottomRef} />
      </main>

      <form className="composer" onSubmit={handleSend}>
        <input
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${room}`}
          maxLength={500}
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
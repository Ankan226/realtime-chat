# Prompts.md - Prompt Engineering Strategy

**Project:** Real-Time Chat with Socket.io 
**Author:** Ankan Pal
**AI tool used:** Claude (Anthropic)

## 1. Strategy

1. **Give full context first.** I pasted the entire sprint brief (all three phases, the FAQ and the submission rules) so the AI worked from the real requirements instead of guessing.
2. **Constrain the output format.** I asked for a folder structure first, then file-by-file code that I could copy and paste. No ZIPs or downloads.
3. **Build in phases.** The code was written to match Phase 1 (base broadcast), Phase 2 (usernames and typing) and Phase 3 (rooms).
4. **Test, then feed back real evidence.** I ran the code locally and sent back terminal output and screenshots, not vague descriptions like "it's not working".
5. **Audit against the rubric.** I pasted the requirements again and asked the AI to check them one by one. This found gaps I would have missed.
6. **Verify myself.** I did not trust the generated code blindly. I ran it in two browser windows and tested every feature manually.

## 2. Prompts used (in order)

| # | Prompt (summary) | Purpose | Outcome |
|---|---|---|---|
| 1 | Pasted the Sprint 12 brief. "Make this project end to end without any error. First make a proper folder structure, then give me file-wise easy, humanized raw code for copy-pasting. My track is B, Fullstack." | Generate the full project | Got a structure with `server/` (Express + Socket.io) and `client/` (React + Vite), plus README and Prompts.md templates |
| 2 | Pasted my terminal output showing Vite warnings after `npm run dev`. | Check whether the warnings were errors | They were deprecation warnings caused by a Vite 8 / plugin version mismatch. Fixed by upgrading `@vitejs/plugin-react` |
| 3 | "All is working fine now, tell me what to do next?" | Get the remaining steps | Got the GitHub, Render, Vercel, demo and submission steps |
| 4 | Sent two screenshots plus the requirements. "Check all the requirements carefully, I think not all are fulfilled." | Audit against the rubric | Found that only one user was shown, deployment was not optional, and `Prompts.md` was still a template. The typing event was also switched from `onChange` to a real `onKeyDown` keyboard event |
| 5 | Sent a screenshot of a blank white page in the VS Code preview. | Debug the blank screen | Tested in real Chrome. Replaced `ChatRoom.jsx` with a clean version. Noticed I had typed `npm rundev` instead of `npm run dev` |
| 6 | "Any limit on how many people can be in a room?" | Understand scalability | No built-in limit. Added an optional `MAX_USERS_PER_ROOM` check on the server |
| 7 | "Give me a very good video recording script." | Prepare the 3-minute QA demo | Got a timed script covering all three phases |
| 8 | "Give me a Prompts.md." | Document this process | This file |

## 3. Problems hit and how they were fixed

| Problem | Cause | Fix |
|---|---|---|
| Vite deprecation warnings (`esbuild`, `oxc`, `jsx` option) | Vite 8 installed with an older React plugin | Ran `npm install -D @vitejs/plugin-react@latest` |
| `npm rundev` failed | Typo (missing space) | Used `npm run dev` |
| Blank page in the VS Code preview tab | Preview tab rendering problem and a possible bad edit in `ChatRoom.jsx` | Opened `http://localhost:5173` in Chrome and replaced the whole component file |
| Typing indicator used `onChange` | The sprint asks for keyboard input events | Switched to `onKeyDown`, with a 1.5 second timeout to stop the indicator |
| Risk of duplicate messages with React StrictMode | Effects run twice in development | Created the socket once in `socket.js` with `autoConnect: false`, and removed every listener in the `useEffect` cleanup |
| CORS | Socket.io needs its own CORS config | Passed an explicit `cors` option to `new Server()` and made the allowed origins configurable with `CLIENT_ORIGIN` |

## 4. Requirement mapping

| Requirement | Where it is implemented |
|---|---|
| Server logs the handshake | `server/index.js` logs `[connect] <socket.id>` |
| Client persistent connection | `client/src/socket.js` |
| Message broadcast back to the DOM | `send_message` then `receive_message` |
| Unique username before connecting | `JoinScreen.jsx`, with a duplicate check in `join_room` on the server |
| `[Name]: text` format | `ChatRoom.jsx` |
| Typing indicator | `onKeyDown` emits `typing`, and the server sends `user_typing` to the room |
| Two or more isolated rooms | `socket.join(room)` and `io.to(room).emit(...)`, with General and Tech Support |
| UI room selection | Dropdown on the join screen and in the chat header |

## 5. What I verified myself

- Ran the server and client locally and opened two browser windows (normal and incognito) side by side.
- Confirmed that messages appear instantly in both windows.
- Confirmed the "X is typing..." indicator shows in the other window and disappears after I stop.
- Confirmed a duplicate username is rejected with an error.
- Confirmed a message sent in General never appears in Tech Support, and the reverse.
- Confirmed that switching rooms loads that room's recent history.
- Confirmed the server terminal prints the connect and join logs.

## 6. Reflection

What worked best was giving the AI complete context and testing everything myself. Sending real terminal output and screenshots got precise fixes quickly. Asking the AI to audit its own work against the rubric caught real gaps. What I learned: Socket.io rooms and CORS behave differently from plain Express, the socket should live outside React components, and effect cleanup is essential to avoid duplicate listeners.
import { io } from "socket.io-client";


export const initializeSocketConnection = () => {
  const socket = io("https://asknova-su5s.onrender.com", {
    transports: ["websocket"],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("Connected to Socket.IO server");
  });

  return socket; // ✅ MUST
};
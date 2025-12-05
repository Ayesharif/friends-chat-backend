import { Chat } from "../Models/Chat.js";

export default function socketConnection(io) {

  console.log("hello");

  // ⭐ MUST be outside the connection event
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // ---------------- JOIN ROOM ----------------
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log("User joined room:", roomId);
    });

    // ---------------- USER ONLINE ----------------
    socket.on("user-online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online-users", Array.from(onlineUsers.keys()));

      console.log("Online users:", Array.from(onlineUsers.keys()));
    });

    // ---------------- SEND MESSAGE ----------------
    socket.on("send_message", async (data) => {
      try {
        const savedMsg = await Chat.create({
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          roomId: data.roomId,
        });

        io.to(data.roomId).emit("receive_message", savedMsg);
      } catch (err) {
        console.error("❌ Error saving message:", err.message);
      }
    });

    // ---------------- DISCONNECT ----------------
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);

      // remove user from onlineUsers
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

  });
}

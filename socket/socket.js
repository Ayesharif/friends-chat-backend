 
import {Chat} from '../Models/Chat.js'
  export default function socketConnection(io) {

    console.log("hello");
    
    io.on("connection", (socket) => {
      console.log("🟢 User connected:", socket.id);

      socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log("User joined room:", roomId);
      });


      const onlineUsers = new Map();

io.on("connection", (socket) => {
  
  // When a user logs in → save their ID
  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  // When user logs out or closes tab
  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
      }
    }
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

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

      socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
      });
    });
  }

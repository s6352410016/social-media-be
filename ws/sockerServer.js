const usersActive = [];

const initSocketServer = (io) => {
  io.on("connection", (socket) => {
    socket.on("connected", (userId) => {
      if (userId !== null) {
        const user = {
          userId: userId,
          socketId: socket.id,
          active: true,
        };
        if (!usersActive.some((e) => e.userId === userId)) {
          usersActive.push(user);
        }
        io.emit("userActive", usersActive);
      }
    });
    socket.on("signUp", () => {
      io.emit("getAllUsers");
    });
    socket.on("created", () => {
      io.emit("notificationServerEmit");
    });
    socket.on("postTransaction", () => {
      io.emit("postTransactionServerEmit");
    });
    socket.on("commentTransaction", () => {
      io.emit("commentTransactionServerEmit");
    });
    socket.on("replyTransaction", () => {
      io.emit("replyTransactionServerEmit");
    });
    socket.on("createChat", () => {
      io.emit("createChat");
    });
    socket.on("deleteMsg", (receiverUserIdOfChatToDelete) => {
      const userSocketId = usersActive.find(
        (e) => e.userId === receiverUserIdOfChatToDelete
      );
      if (userSocketId !== undefined && userSocketId !== null) {
        io.to(userSocketId.socketId).emit("createChat");
      }
    });
    socket.on("createChatMsg", ({ msgData, receiverData }) => {
      const userSocketId = usersActive.find((e) => e.userId === receiverData);
      if (userSocketId !== undefined && userSocketId !== null) {
        io.to(userSocketId.socketId).emit("createChatMsg", msgData);
      }
    });
    socket.on("disconnect", () => {
      const userDisconnect = usersActive.find((e) => e.socketId === socket.id);
      const removeUserDisconnect = usersActive.findIndex(
        (e) => e.socketId === userDisconnect?.socketId
      );
      if (userDisconnect !== undefined && userDisconnect !== null) {
        userDisconnect.active = false;
        io.emit("disconnected", userDisconnect);

        if (removeUserDisconnect !== -1) {
          usersActive.splice(removeUserDisconnect, 1);
        }
      }
    });
  });
};

module.exports = initSocketServer;
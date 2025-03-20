const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const authRoute = require("./routes/authRoute");
const postRoute = require("./routes/postRoute");
const commentRoute = require("./routes/commentRoute");
const replyRoute = require("./routes/replyRoute");
const chatRoute = require("./routes/chatRoute");
const notificationRoute = require("./routes/notificationRoute");
const sharePostRoute = require("./routes/sharePostRoute");
const connectDb = require("./db/conDb");
const initSocketServer = require("./ws/sockerServer");
require("dotenv").config();

const app = express();
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [
      "https://bynsocial-admin.onrender.com",
      "http://localhost:3000",
      "http://18.142.245.1",
    ],
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
});
const PORT = process.env.PORT || 5000;

initSocketServer(io);

app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  userRoute,
  adminRoute,  
  authRoute,
  postRoute,
  sharePostRoute,
  commentRoute,
  replyRoute,
  chatRoute,
  notificationRoute
);

(async () => {
  try {
    await connectDb();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to connect server");
  }
})();

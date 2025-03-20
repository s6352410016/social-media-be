const router = require("express").Router();
const chatControllers = require("../controllers/chatController");
const messageControllers = require("../controllers/messageController");
const multer = require("multer");
const path = require("path");
const { authUser } = require("../middleware/authUser");
const multerS3 = require("multer-s3");
const s3Config = require("../config/s3Config");
const { v4: uuidv4 } = require("uuid");

const s3 = s3Config();

router.use("/chat", authUser);

const messageImgUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      const newFileName = `chat/${uuidv4()}.${fileExt}`;
      cb(null, newFileName);
    },
  }),
});

router.post("/chat/createChat", chatControllers.createChat);
router.post("/chat/getAllChats", chatControllers.getAllChats);
router.post("/chat/getAllMessages", messageControllers.getAllMessages);
router.post(
  "/chat/getAllChatByUserId/:userId",
  chatControllers.getAllChatByUserId
);
router.post("/chat/findChat/:senderId/:receiverId", chatControllers.findChat);
router.post(
  "/chat/createMessage",
  messageImgUpload.array("chatImg"),
  messageControllers.createMessage
);
router.post("/chat/getMessage", messageControllers.getMessage);
router.post(
  "/chat/getLastMessageByChatId",
  messageControllers.getLastMessageByChatId
);
router.delete("/chat/deleteMsgByChatId", messageControllers.deleteMsgByChatId);
// router.delete('/deleteMessage', messageControllers.deleteMsg);

module.exports = router;

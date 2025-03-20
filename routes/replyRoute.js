const router = require("express").Router();
const replyControllers = require("../controllers/replyController");
const multer = require("multer");
const path = require("path");
const { authUser } = require("../middleware/authUser");
const multerS3 = require("multer-s3");
const s3Config = require("../config/s3Config");
const { v4: uuidv4 } = require("uuid");

const s3 = s3Config();

router.use("/reply", authUser);

const replyImgUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      const newFileName = `reply/${uuidv4()}.${fileExt}`;
      cb(null, newFileName);
    },
  }),
});

router.post(
  "/reply/createReply",
  replyImgUpload.single("replyImg"),
  replyControllers.createReply
);
router.post("/reply/getAllReplys", replyControllers.getAllReplys);
router.delete("/reply/deleteReply", replyControllers.deleteReply);
router.post("/reply/getReplyByCommentId", replyControllers.getReplyByCommentId);
router.put(
  "/reply/updateReplyWithImage",
  replyImgUpload.single("replyImg"),
  replyControllers.updateReplyWithImage
);
router.put(
  "/reply/updateReplyWithMsg",
  replyImgUpload.single("replyImg"),
  replyControllers.updateReplyWithMsg
);
router.put(
  "/reply/updateReplyWithImageAndMsg",
  replyImgUpload.single("replyImg"),
  replyControllers.updateReplyWithImageAndMsg
);
router.delete("/reply/deleteReplyMsg", replyControllers.deleteReplyMsg);
router.put("/reply/likeAndDislikeReply", replyControllers.likeAndDislikeReply);

module.exports = router;

const router = require("express").Router();
const commentControllers = require("../controllers/commentController");
const multer = require("multer");
const path = require("path");
const { authUser } = require("../middleware/authUser");
const multerS3 = require("multer-s3");
const s3Config = require("../config/s3Config");
const { v4: uuidv4 } = require("uuid");

const s3 = s3Config();

router.use("/comment", authUser);

const commentImgUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      const newFileName = `comment/${uuidv4()}.${fileExt}`;
      cb(null, newFileName);
    },
  }),
});

router.post(
  "/comment/createComment",
  commentImgUpload.single("commentImage"),
  commentControllers.createComment
);
router.put(
  "/comment/updateCommentWithImage",
  commentImgUpload.single("commentImage"),
  commentControllers.updateCommentWithImage
);
router.put(
  "/comment/updateCommentWithMsgs",
  commentControllers.updateCommentWithMsgs
);
router.delete("/comment/deleteComment", commentControllers.deleteComment);
router.delete("/comment/deleteCommentMsg", commentControllers.deleteCommentMsg);
router.post("/comment/getAllComments", commentControllers.getAllComments);
router.post(
  "/comment/getCommentByPostId",
  commentControllers.getCommentByPostId
);
router.put(
  "/comment/likeAndDislikeComment",
  commentControllers.likeAndDislikeComment
);

module.exports = router;

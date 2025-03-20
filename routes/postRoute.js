const router = require("express").Router();
const postControllers = require("../controllers/postController");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { authUser } = require("../middleware/authUser");
const s3Config = require("../config/s3Config");
const { v4: uuidv4 } = require("uuid");

const s3 = s3Config();

const postImgsUpload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileExt = file.mimetype.split("/")[1];
            const newFileName = `post/image/${uuidv4()}.${fileExt}`;
            cb(null, newFileName);
        },
    }),
});

const postVideoUpload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileExt = file.mimetype.split("/")[1];
            const newFileName = `post/video/${uuidv4()}.${fileExt}`;
            cb(null, newFileName);
        },
    }),
});

router.use("/post", authUser);
router.post("/post/createPostWithMsg", postControllers.createPostWithMsg);
router.post(
  "/post/createPostWithImages",
  postImgsUpload.array("postImage"),
  postControllers.createPostWithImages
);
router.post(
  "/post/createPostWithVideo",
  postVideoUpload.single("postVideo"),
  postControllers.createPostWithVideo
);
router.put(
  "/post/updatePostWithImages",
  postImgsUpload.array("postImage"),
  postControllers.updatePostWithImages
);
router.put(
  "/post/updatePostWithVideo",
  postVideoUpload.single("postVideo"),
  postControllers.updatePostWithVideo
);
router.put("/post/updatePostWithMsg", postControllers.updatePostWithMsg);
router.delete("/post/deletePost", postControllers.deletePost);
router.put("/post/likeAndDislikePost", postControllers.likeAndDislikePost);
router.post("/post/getAllPosts", postControllers.getAllPosts);

module.exports = router;

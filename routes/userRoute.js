const router = require("express").Router();
const userControllers = require("../controllers/userController");
const multer = require("multer");
const { authUser } = require("../middleware/authUser");
const multerS3 = require("multer-s3");
const s3Config = require("../config/s3Config");
const { v4: uuidv4 } = require("uuid");

const s3 = s3Config();

const userProfileImgUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      const newFileName = `user/profileImage/${uuidv4()}.${fileExt}`;
      cb(null, newFileName);
    },
  }),
});

const userBgImgUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileExt = file.mimetype.split("/")[1];
      const newFileName = `user/backgroundImage/${uuidv4()}.${fileExt}`;
      cb(null, newFileName);
    },
  }),
});

router.use("/user", authUser);
router.put("/user/followAndUnFollow", userControllers.followAndUnFollow);
router.post("/user/getAllUsers", userControllers.getAllUsers);
router.post("/user/getUserByUserId", userControllers.getUserByUserId);
router.delete(
  "/user/deleteCurrentProfileImg",
  userControllers.deleteCurrentProfileImg
);
router.delete(
  "/user/deleteCurrentProfileBgImg",
  userControllers.deleteCurrentProfileBgImg
);
router.post(
  "/user/checkUserExistUpdateProfile",
  userControllers.checkUserExistUpdateProfile
);
router.put(
  "/user/uploadProfileImg/:id",
  userProfileImgUpload.single("profileImg"),
  userControllers.uploadProfileImg
);
router.put(
  "/user/uploadProfileBgImg/:id",
  userBgImgUpload.single("profileBgImg"),
  userControllers.uploadProfileBgImg
);
router.put(
  "/user/updateOtherDetailOfUserByUserId/:id",
  userControllers.updateOtherDetailOfUserByUserId
);

module.exports = router;

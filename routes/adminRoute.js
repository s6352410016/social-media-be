const router = require('express').Router();
const signinControllers = require('../controllers/signinController');
const postControllers = require('../controllers/postController');
const commentControllers = require('../controllers/commentController');
const userControllers = require('../controllers/userController');
const notificationControllers = require('../controllers/notificationController');
const chatControllers = require('../controllers/chatController');
const messageControllers = require('../controllers/messageController');
const replyControllers = require("../controllers/replyController");
const { authUser } = require('../middleware/authUser');

router.use("/admin", authUser);

router.post("/adminLogin" , signinControllers.adminLogin);
router.post("/admin/blockUser" , userControllers.blockUser);
router.post("/admin/editUserDataAdmin" , userControllers.editUserDataAdmin);
router.post("/admin/blockPost" , postControllers.blockPost);
router.post("/admin/blockComment" , commentControllers.blockComment);
router.post("/admin/blockReply" , replyControllers.blockReply);
router.post("/admin/blockNotification" , notificationControllers.blockNotification);
router.post("/admin/blockChat" , chatControllers.blockChat);
router.post("/admin/blockMsg" , messageControllers.blockMsg);

module.exports = router;
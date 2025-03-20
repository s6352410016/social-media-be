const router = require('express').Router();
const notificationControllers = require('../controllers/notificationController');
const { authUser } = require('../middleware/authUser');

router.use("/noti", authUser);

router.post('/noti/createNotification', notificationControllers.createNotification);
router.post('/noti/getAllNotifications', notificationControllers.getAllNotification);
router.put('/noti/updateUserToReadNotification', notificationControllers.updateUserToReadNotification);
// router.delete("/clearAllNotification" , notificationControllers.clearAllNotification);

module.exports = router;
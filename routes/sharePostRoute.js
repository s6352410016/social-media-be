const router = require('express').Router();
const shareControllers = require('../controllers/shareController');
const { authUser } = require('../middleware/authUser');

router.use("/sharePost", authUser);
 
router.post('/sharePost/createSharePost', shareControllers.createSharePost);
router.put('/sharePost/updateSharePost', shareControllers.updateSharePost);
router.delete('/sharePost/deleteSharePost', shareControllers.deleteSharePost);
router.put('/sharePost/sharePostLikeAndDislike', shareControllers.sharePostLikeAndDislike);
router.post('/sharePost/getAllSharePost', shareControllers.getAllSharePost);
router.post('/sharePost/getAllSharePostByUserIdToShare/:id', shareControllers.getAllSharePostByUserIdToShare);

module.exports = router;
const shareModel = require("../model/shareModel");
const commentModel = require("../model/commentModel");
const notificationModel = require("../model/notificationModel");
const replyModel = require("../model/replyModel");
const s3Config = require("../config/s3Config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = s3Config();

const createSharePost = async (req, res) => {
  try {
    const { postIdToShare, userIdToShare, shareMsg } = req.body;
    const saveSharePost = new shareModel({
      postIdToShare: postIdToShare,
      userIdToShare: userIdToShare,
      shareMsg: shareMsg,
    });
    const data = await saveSharePost.save();
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updateSharePost = async (req, res) => {
  try {
    const { shareId, shareMsg } = req.body;
    await shareModel.findByIdAndUpdate(
      {
        _id: shareId,
      },
      {
        shareMsg: shareMsg,
      }
    );
    return res.status(200).json({ msg: "share post updated." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteSharePost = async (req, res) => {
  try {
    const { shareId, activeUserId } = req.body;
    await notificationModel.deleteMany({
      notificationOfPostId: shareId,
    });
    const commentOfPostData = await commentModel.find({
      postIdToComment: shareId,
    });
    commentOfPostData.map(async (e) => {
      const replyData = await replyModel.find({
        commentIdToReply: e?._id,
      });
      replyData.map(async (reply) => {
        if (reply.replyImg !== "") {
          const delImgCmd = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `reply/${reply.replyImg}`,
          });
          await s3.send(delImgCmd);
        }
        await replyModel.findByIdAndDelete({
          _id: reply?._id,
        });
      });
      if(e.commentImg !== "") {
        const delImgCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `comment/${e.commentImg}`,
        });
        await s3.send(delImgCmd);
      }
    });
    await commentModel.deleteMany({
      postIdToComment: shareId,
    });
    await shareModel.findByIdAndDelete({
      _id: shareId,
    });
    return res.status(200).json({ msg: "share post deleted." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const sharePostLikeAndDislike = async (req, res) => {
  try {
    const { shareId, userId, userIdToShare } = req.body;
    const sharePostData = await shareModel.findById({
      _id: shareId,
    });
    if (!sharePostData.sharePostLikes.includes(userId)) {
      await sharePostData.updateOne({
        $push: {
          sharePostLikes: userId,
        },
      });
      if (userIdToShare !== userId) {
        const notificationData = new notificationModel({
          notificationOfUserId: userId,
          notificationOfPostId: shareId,
          notificationDetail: "Like your post",
          notificationOfReceiverId: [userIdToShare],
        });
        await notificationData.save();
      }
    } else {
      await sharePostData.updateOne({
        $pull: {
          sharePostLikes: userId,
        },
      });
      await notificationModel.findOneAndDelete({
        notificationOfUserId: userId,
        notificationOfPostId: shareId,
        notificationDetail: "Like your post",
      });
    }
    return res.status(200).json({ msg: "pending success." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getAllSharePost = async (req, res) => {
  try {
    const sharePosts = await shareModel.find();
    if (!res.headersSent) {
      return res.status(200).json(sharePosts);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getAllSharePostByUserIdToShare = async (req, res) => {
  try {
    const { id } = req.params;
    const sharePosts = await shareModel.find({
      userIdToShare: id,
    });
    if (!res.headersSent) {
      return res.status(200).json(sharePosts);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  createSharePost,
  updateSharePost,
  deleteSharePost,
  sharePostLikeAndDislike,
  getAllSharePost,
  getAllSharePostByUserIdToShare,
};

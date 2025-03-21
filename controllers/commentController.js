const commentModel = require("../model/commentModel");
const notificationModel = require("../model/notificationModel");
const replyModel = require("../model/replyModel");
const s3Config = require("../config/s3Config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = s3Config();

const createComment = async (req, res) => {
  try {
    const { postIdToComment, userIdToComment, commentMsgs } = req.body;
    let fileName = "";
    if (req.file) {
      fileName = req.file.key.split("/").pop();
    }
    const saveComment = new commentModel({
      postIdToComment: postIdToComment,
      userIdToComment: userIdToComment,
      commentMsgs: commentMsgs,
      commentImg: req.file !== undefined ? fileName : "",
    });
    const commentData = await saveComment.save();
    return res
      .status(201)
      .json({ msg: "comment created", commentId: commentData._id });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updateCommentWithImage = async (req, res) => {
  try {
    const { commentId, commentMsgs } = req.body;
    let fileName = "";
    if (req.file) {
      fileName = req.file.key.split("/").pop();
    }
    const commentData = await commentModel.findById({
      _id: commentId,
    });
    const delImgCmd = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `comment/${commentData.commentImg}`,
    });
    await s3.send(delImgCmd);
    await commentData.updateOne({
      commentImg: req.file !== undefined ? fileName : "",
      commentMsgs: commentMsgs,
    });
    return res.status(200).json({ msg: "comment updated." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updateCommentWithMsgs = async (req, res) => {
  try {
    const { commentId, commentMsgs, deleteImgInEditComment } = req.body;
    const commentData = await commentModel.findById({
      _id: commentId,
    });
    if (deleteImgInEditComment) {
      const delImgCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `comment/${commentData.commentImg}`,
      });
      await s3.send(delImgCmd);
      await commentData.updateOne({
        commentImg: "",
      });
    }
    await commentModel.findByIdAndUpdate(
      {
        _id: commentId,
      },
      {
        commentMsgs: commentMsgs,
      }
    );
    return res.status(200).json({ msg: "comment updated." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const replyData = await replyModel.find({
      commentIdToReply: commentId,
    });
    replyData.map(async (reply) => {
      if (reply.replyImg !== "") {
        const delImgCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `reply/${reply.replyImg}`,
        });
        await s3.send(delImgCmd);
      }
      await notificationModel.deleteOne({
        notificationOfReplyId: reply._id,
      });
    });
    await replyModel.deleteMany({
      commentIdToReply: commentId,
    });
    await notificationModel.deleteMany({
      notificationOfCommentId: commentId,
    });
    const commentData = await commentModel.findById({
      _id: commentId,
    });
    const delImgCmd = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `comment/${commentData.commentImg}`,
    });
    await s3.send(delImgCmd);
    await commentData.deleteOne();
    return res.status(200).json({ msg: "comment deleted." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteCommentMsg = async (req, res) => {
  try {
    const { commentId } = req.body;
    await commentModel.findByIdAndUpdate(
      {
        _id: commentId,
      },
      {
        commentMsgs: "",
      }
    );
    return res.status(200).json({ msg: "delete comment msg sucessfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getAllComments = async (req, res) => {
  try {
    const comments = await commentModel.find();
    if (!res.headersSent) {
      return res.status(200).json(comments);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getCommentByPostId = async (req, res) => {
  try {
    const { postId } = req.body;
    const comments = await commentModel.find({
      postIdToComment: postId,
    });
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json(err);
  }
};

const likeAndDislikeComment = async (req, res) => {
  try {
    const { commentId, userIdToLike, postId, userIdToComment } = req.body;
    const commentData = await commentModel.findById({
      _id: commentId,
    });
    if (!commentData.commentLikes.includes(userIdToLike)) {
      await commentData.updateOne({
        $push: {
          commentLikes: userIdToLike,
        },
      });
      if (userIdToLike !== userIdToComment) {
        const notificationData = new notificationModel({
          notificationOfUserId: userIdToLike,
          notificationOfPostId: postId,
          notificationOfCommentId: commentId,
          notificationDetail: "Like your comment",
          notificationOfReceiverId: userIdToComment,
        });
        await notificationData.save();
      }
    } else {
      await commentData.updateOne({
        $pull: {
          commentLikes: userIdToLike,
        },
      });
      await notificationModel.findOneAndDelete({
        notificationOfUserId: userIdToLike,
        notificationOfCommentId: commentId,
        notificationDetail: "Like your comment",
      });
    }
    res.status(200).json({ msg: "pending successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const blockComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const comment = await commentModel.findById({ _id: commentId });
    if (comment) {
      if (comment.isBlock) {
        await comment.updateOne({
          isBlock: false,
        });
      } else {
        await comment.updateOne({
          isBlock: true,
        });
      }

      return res.status(200).json({ msg: "successfully." });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  createComment,
  updateCommentWithImage,
  updateCommentWithMsgs,
  deleteComment,
  getAllComments,
  likeAndDislikeComment,
  deleteCommentMsg,
  getCommentByPostId,
  blockComment,
};

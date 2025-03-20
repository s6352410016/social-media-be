const postModel = require("../model/postModel");
const commentModel = require("../model/commentModel");
const notificationModel = require("../model/notificationModel");
const replyModel = require("../model/replyModel");
const sharePostModel = require("../model/shareModel");
const s3Config = require("../config/s3Config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = s3Config();

const createPostWithMsg = async (req, res) => {
  try {
    const { userIdToPost, postMsg } = req.body;
    const savePost = await new postModel({
      userIdToPost: userIdToPost,
      postMsg: postMsg,
    });
    const postData = await savePost.save();
    return res.status(201).json({ msg: "post created.", postId: postData._id });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const createPostWithImages = async (req, res) => {
  try {
    const { userIdToPost, postMsg } = req.body;
    const savePost = new postModel({
      userIdToPost: userIdToPost,
      postMsg: postMsg,
      postImgs: req.files.map((e) => {
        const fileName = e.key.split("/").pop();
        return fileName;
      }),
    });
    const postData = await savePost.save();
    return res.status(201).json({ msg: "post created.", postId: postData._id });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const createPostWithVideo = async (req, res) => {
  try {
    const { userIdToPost, postMsg } = req.body;
    let fileName = "";
    if (req.file) {
      fileName = req.file.key.split("/").pop();
    }
    const savePost = await new postModel({
      userIdToPost: userIdToPost,
      postMsg: postMsg,
      postVideo: req.file !== undefined ? fileName : "",
    });
    const postData = await savePost.save();
    return res.status(201).json({ msg: "post created.", postId: postData._id });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updatePostWithImages = async (req, res) => {
  try {
    const { postId, postMsg } = req.body;
    const postData = await postModel.findById({
      _id: postId,
    });

    const delVideoCmd = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `post/video/${postData.postVideo}`,
    });

    await Promise.all([
      s3.send(delVideoCmd),
      postData.postImgs.map(async (img) => {
        const delImgsCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `post/image/${img}`,
        });

        s3.send(delImgsCmd);
      }),
      postModel.findByIdAndUpdate(
        {
          _id: postId,
        },
        {
          postMsg: postMsg,
          postImgs:
            req.files !== undefined
              ? req.files.map((e) => {
                  const fileName = e.key.split("/").pop();
                  return fileName;
                })
              : [],
          postVideo: "",
        }
      ),
    ]);

    return res.status(200).json({ msg: "post updated." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updatePostWithVideo = async (req, res) => {
  try {
    const { postId, postMsg } = req.body;
    let fileName = "";
    if (req.file) {
      fileName = req.file.key.split("/").pop();
    }
    const postData = await postModel.findById({
      _id: postId,
    });

    const delVideoCmd = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `post/video/${postData.postVideo}`,
    });

    await Promise.all([
      postData.postImgs.map(async (img) => {
        const delImgsCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `post/image/${img}`,
        });
        s3.send(delImgsCmd);
      }),
      s3.send(delVideoCmd),
      postModel.findByIdAndUpdate(
        {
          _id: postId,
        },
        {
          postMsg: postMsg,
          postVideo: req.file !== undefined ? fileName : "",
          postImgs: [],
        }
      ),
    ]);

    return res.status(200).json({ msg: "post updated." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updatePostWithMsg = async (req, res) => {
  try {
    const { postId, postMsg, deleteCurrentPostImage, deleteCurrentPostVideo } =
      req.body;
    const postData = await postModel.findById({
      _id: postId,
    });
    if (deleteCurrentPostImage) {
      postData.postImgs.map(async (img) => {
        const delImgsCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `post/image/${img}`,
        });
        await s3.send(delImgsCmd);
      }),
        await postData.updateOne({
          postImgs: [],
        });
    }
    if (deleteCurrentPostVideo) {
      const delVideoCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `post/video/${postData.postVideo}`,
      });
      await s3.send(delVideoCmd);
      await postData.updateOne({
        postVideo: "",
      });
    }
    await postModel.findByIdAndUpdate(
      {
        _id: postId,
      },
      {
        postMsg: postMsg,
      }
    );
    return res.status(200).json({ msg: "post updated." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    await notificationModel.deleteMany({
      notificationOfPostId: postId,
    });
    const postData = await postModel.findById({
      _id: postId,
    });
    const commentOfPostData = await commentModel.find({
      postIdToComment: postId,
    });
    const replyOfCommentData = await replyModel.find({
      postIdToReply: postId,
    });
    replyOfCommentData.map(async (reply) => {
      if (reply.replyImg !== "") {
        const delImgCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `reply/${reply.replyImg}`,
        });
        await s3.send(delImgCmd);
      }
    });
    commentOfPostData.map(async (comment) => {
      const delImgCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `comment/${comment.commentImg}`,
      });
      await s3.send(delImgCmd);
    });
    const delVideoCmd = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `post/video/${postData.postVideo}`,
    });

    await Promise.all([
      postData.postImgs.map(async (img) => {
        const delImgsCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `post/image/${img}`,
        });
        s3.send(delImgsCmd);
      }),
      s3.send(delVideoCmd),
    ]);

    await postModel.findByIdAndDelete({
      _id: postId,
    });
    return res.status(200).json({ msg: "post deleted." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const likeAndDislikePost = async (req, res) => {
  try {
    const { postId, userId, userIdToPost } = req.body;
    const postData = await postModel.findById({
      _id: postId,
    });
    if (!postData.postLikes.includes(userId)) {
      await postData.updateOne({
        $push: {
          postLikes: userId,
        },
      });
      if (userIdToPost !== userId) {
        const notificationData = new notificationModel({
          notificationOfUserId: userId,
          notificationOfPostId: postId,
          notificationDetail: "Like your post",
          notificationOfReceiverId: [userIdToPost],
        });
        await notificationData.save();
      }
    } else {
      await postData.updateOne({
        $pull: {
          postLikes: userId,
        },
      });
      await notificationModel.findOneAndDelete({
        notificationOfUserId: userId,
        notificationOfPostId: postId,
        notificationDetail: "Like your post",
      });
    }
    return res.status(200).json({ msg: "pending success." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await postModel.find();
    if (!res.headersSent) {
      return res.status(200).json(posts);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const blockPost = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await postModel.findById({ _id: postId });
    const sharePost = await sharePostModel.findById({ _id: postId });

    if (post) {
      if (post.isBlock) {
        await post.updateOne({
          isBlock: false,
        });
      } else {
        await post.updateOne({
          isBlock: true,
        });
      }
    }

    if (sharePost) {
      if (sharePost.isBlock) {
        await sharePost.updateOne({
          isBlock: false,
        });
      } else {
        await sharePost.updateOne({
          isBlock: true,
        });
      }
    }

    return res.status(200).json({ msg: "successfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  createPostWithMsg,
  createPostWithImages,
  createPostWithVideo,
  updatePostWithImages,
  updatePostWithVideo,
  updatePostWithMsg,
  deletePost,
  likeAndDislikePost,
  getAllPosts,
  blockPost,
};

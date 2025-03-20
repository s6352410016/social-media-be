const userModel = require("../model/userModel");
const notificationModel = require("../model/notificationModel");
const bcrypt = require("bcrypt");
const s3Config = require("../config/s3Config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = s3Config();

const followAndUnFollow = async (req, res) => {
  try {
    const { activeUserId, userIdToFollow } = req.body;
    const userDataOfuserIdToFollow = await userModel.findById({
      _id: userIdToFollow,
    });
    if (!userDataOfuserIdToFollow.follower.includes(activeUserId)) {
      await userDataOfuserIdToFollow.updateOne({
        $push: {
          follower: activeUserId,
        },
      });
      await userModel.findByIdAndUpdate(
        {
          _id: activeUserId,
        },
        {
          $push: {
            following: userIdToFollow,
          },
        }
      );
      const notificationData = new notificationModel({
        notificationOfUserId: activeUserId,
        notificationDetail: "Following you",
        notificationOfReceiverId: [userIdToFollow],
      });
      await notificationData.save();
    } else {
      await userDataOfuserIdToFollow.updateOne({
        $pull: {
          follower: activeUserId,
        },
      });
      await userModel.findByIdAndUpdate(
        {
          _id: activeUserId,
        },
        {
          $pull: {
            following: userIdToFollow,
          },
        }
      );
      await notificationModel.findOneAndDelete({
        notificationOfUserId: activeUserId,
        notificationDetail: "Following you",
        notificationOfReceiverId: [userIdToFollow],
      });
    }
    return res.status(200).json({ msg: "pending success." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find(
      {},
      "_id firstname lastname username email follower following dateOfBirth profilePicture profileBackground otherDetail createdAt updatedAt isAdmin isBlock"
    );
    if (!res.headersSent) {
      return res.status(200).json(users);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getUserByUserId = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findOne({
      _id: userId,
    });
    if (userData) {
      return res.status(200).json(userData);
    }
    return res.status(404).json({ msg: "user not found." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const uploadProfileImg = async (req, res) => {
  try {
    const { id } = req.params;
    let fileName = "";
    if (req.file) {
      fileName = req.file.key.split("/").pop();
    }
    const userData = await userModel.findById({
      _id: id,
    });
    if (userData?.profilePicture !== "") {
      const delImgCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `user/profileImage/${userData.profilePicture}`,
      });
      await s3.send(delImgCmd);
    }
    await userModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        profilePicture: fileName,
      }
    );
    return res
      .status(200)
      .json({ msg: "profile picture uploaded successfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const uploadProfileBgImg = async (req, res) => {
  try {
    const { id } = req.params;
    let fileName = "";
    if (req.file) {
      fileName = req.file.key.split("/").pop();
    }
    const userData = await userModel.findById({
      _id: id,
    });
    if (userData?.profileBackground !== "") {
      const delImgCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `user/backgroundImage/${userData.profileBackground}`,
      });
      await s3.send(delImgCmd);
    }
    await userModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        profileBackground: fileName,
      }
    );
    return res
      .status(200)
      .json({ msg: "profile background picture uploaded successfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const updateOtherDetailOfUserByUserId = async (req, res) => {
  try {
    const { firstname, lastname, dateOfBirth, otherDetail } = req.body;
    const { id } = req.params;
    await userModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        firstname: firstname,
        lastname: lastname,
        dateOfBirth: dateOfBirth,
        otherDetail: otherDetail,
      }
    );
    return res.status(200).json({ msg: "user detail updated successfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteCurrentProfileImg = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById({
      _id: userId,
    });
    if (userData.profilePicture !== "") {
      const delImgCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `user/profileImage/${userData.profilePicture}`,
      });
      await s3.send(delImgCmd);
      await userData.updateOne({
        profilePicture: "",
      });
      return res
        .status(200)
        .json({ msg: "delete current profile img successfully." });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteCurrentProfileBgImg = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById({
      _id: userId,
    });
    if (userData.profileBackground !== "") {
      const delImgCmd = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `user/backgroundImage/${userData.profileBackground}`,
      });
      await s3.send(delImgCmd);
      await userData.updateOne({
        profileBackground: "",
      });
      return res.status(200).json({
        msg: "delete current profile background img successfully.",
      });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const checkUserExistUpdateProfile = async (req, res) => {
  try {
    const { firstname, lastname, userId } = req.body;
    const userExist = await userModel.findOne({
      firstname,
      lastname,
    });

    if (userExist && userExist._id.toString() !== userId) {
      return res
        .status(400)
        .json({ msg: "fristname and lastname is already exist." });
    }

    return res.status(200).json({ msg: "fristname is already use." });
  } catch (err) {
    return res.status(500).json({ msg: err });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById({ _id: userId });
    if (user) {
      if (user.isBlock) {
        await user.updateOne({
          isBlock: false,
        });
      } else {
        await user.updateOne({
          isBlock: true,
        });
      }

      return res.status(200).json({ msg: "successfully." });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const editUserDataAdmin = async (req, res) => {
  try {
    const { userId, email, password, isAdminStatus } = req.body;
    const userData = await userModel.findOne({ email });

    if (userData && userData._id.toString() !== userId) {
      return res.status(400).json({ msg: "email is already exist." });
    }

    if (password !== "") {
      const hash_password = await bcrypt.hash(password, 10);
      await userModel.findByIdAndUpdate(
        {
          _id: userId,
        },
        {
          email: email,
          password: hash_password,
          isAdmin: isAdminStatus,
        }
      );
      return res.status(200).json({ msg: "update data successfullly." });
    }

    await userModel.findByIdAndUpdate(
      {
        _id: userId,
      },
      {
        email: email,
        isAdmin: isAdminStatus,
      }
    );

    return res.status(200).json({ msg: "update data successfullly." });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  followAndUnFollow,
  getAllUsers,
  getUserByUserId,
  uploadProfileImg,
  uploadProfileBgImg,
  updateOtherDetailOfUserByUserId,
  deleteCurrentProfileImg,
  deleteCurrentProfileBgImg,
  checkUserExistUpdateProfile,
  blockUser,
  editUserDataAdmin,
};

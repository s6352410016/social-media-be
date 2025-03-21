const messageModel = require("../model/messageModel");
const chatModel = require("../model/chatModel");
const s3Config = require("../config/s3Config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = s3Config();

const createMessage = async (req, res) => {
  try {
    const { chatId, senderId, chatMsg } = req.body;
    const saveMessage = new messageModel({
      chatId: chatId,
      senderId: senderId,
      chatMsg: chatMsg,
      chatImages:
        req.files !== undefined
          ? req.files.map((e) => {
              const fileName = e.key.split("/").pop();
              return fileName;
            })
          : [],
    });
    const msgData = await saveMessage.save();
    return res.status(201).json(msgData);
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getMessage = async (req, res) => {
  try {
    const { chatId } = req.body;
    const message = await messageModel.find({
      chatId: chatId,
    });
    if (!res.headersSent) {
      return res.status(200).json(message);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const getLastMessageByChatId = async (req, res) => {
  try {
    const { chatId } = req.body;
    const message = await messageModel
      .findOne({
        chatId: chatId,
      })
      .sort({
        createdAt: -1,
      })
      .limit(1);
    if (!res.headersSent) {
      return res.status(200).json(message);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteMsg = async (req, res) => {
  try {
    await messageModel.deleteMany();
    return res.status(200).json({ msg: "deleted all messages successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const deleteMsgByChatId = async (req, res) => {
  try {
    const { chatId } = req.body;
    const msgData = await messageModel.find({
      chatId: chatId,
    });
    msgData.map((msg) => {
      msg.chatImages.map(async (image) => {
        if (image) {
          const delImgCmd = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `chat/${image}`,
          });

          await s3.send(delImgCmd);
        }
      });
    });
    await messageModel.deleteMany({
      chatId: chatId,
    });
    await chatModel.findByIdAndDelete({
      _id: chatId,
    });
    return res.status(200).json({ msg: "deleted all messages successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const getAllMessages = async (req, res) => {
  try {
    const messages = await messageModel.find();
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

const blockMsg = async (req, res) => {
  try {
    const { msgId } = req.body;
    const msg = await messageModel.findById({ _id: msgId });
    if (msg) {
      if (msg.isBlock) {
        await msg.updateOne({
          isBlock: false,
        });
      } else {
        await msg.updateOne({
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
  createMessage,
  getMessage,
  getLastMessageByChatId,
  deleteMsg,
  deleteMsgByChatId,
  getAllMessages,
  blockMsg,
};

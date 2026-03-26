import { NotFoundException } from "../../common/index.js";
import {
  createOne,
  findOne,
  findOneAndDelete,
  MessageModel,
  UserModel,
} from "../../DB/index.js";

export const sendMessage = async (
  receiverId,
  { content = undefined } = {},
  files,
  user,
) => {
  const account = await findOne({
    model: UserModel,
    filter: { _id: receiverId, confirmEmail: { $exists: true } },
  });

  if (!account) {
    throw NotFoundException({
      message: "Fail to find matching receiver account",
    });
  }

  const message = await createOne({
    model: MessageModel,
    data: {
      content,
      attachments: files.map((file) => file.path),
      receiverId,
      senderId: user ? user._id : undefined,
    },
  });
  return message;
};

export const getMessage = async (messageId, user) => {
  const message = await findOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      $or: [{ receiverId: user._id }, { senderId: user._id }],
    },
    select: "-senderId",
  });

  if (!message) {
    throw NotFoundException({
      message: " Invalid message or not authorized actions",
    });
  }

  return message;
};

export const deleteMessage = async (messageId, user) => {
  const message = await findOneAndDelete({
    model: MessageModel,
    filter: {
      _id: messageId,
      receiverId: user._id,
    },
    select: "-senderId",
  });

  if (!message) {
    throw NotFoundException({
      message: " Invalid message or not authorized actions",
    });
  }

  return message;
};

export const getMessages = async (user) => {
  const messages = await findOne({
    model: MessageModel,
    filter: {
      $or: [{ receiverId: user._id }, { senderId: user._id }],
    },
    select: "-senderId",
  });

  return messages;
};

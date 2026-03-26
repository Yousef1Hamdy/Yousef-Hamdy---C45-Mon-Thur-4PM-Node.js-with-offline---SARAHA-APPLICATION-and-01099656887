import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 1000,
      required: function () {
        return !this.attachments?.length;
      },
    },
    attachments: {
      type: [String],
    },
    receiverId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

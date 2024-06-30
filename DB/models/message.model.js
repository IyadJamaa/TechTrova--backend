import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isFromUser: { type: Boolean, default: true }, 
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Message = model("Message", messageSchema);

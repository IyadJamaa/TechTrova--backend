import axios from "axios";
import { asyncHandler } from "../../utils/asyncHandler.js";
import dotenv from "dotenv";
import { Message } from "../../../DB/models/message.model.js";

dotenv.config();

export const sendMessage = asyncHandler(async (req, res, next) => {
  const { message, conversationId, fileUrl } = req.body;
  const userId = req.user._id;

  if (!message) {
    const error = new Error("Message content is required");
    error.status = 400;
    return next(error);
  }

  const userMessage = await Message.create({
    user: userId,
    isFromUser: true,
    message: message,
  });

  const response = await axios.post(
    "https://api.dify.ai/v1/chat-messages",
    {
      inputs: {},
      query: message,
      response_mode: "blocking",
      conversation_id: conversationId || "",
      user: userId,
      files: fileUrl
        ? [{ type: "image", transfer_method: "remote_url", url: fileUrl }]
        : [],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.data || !response.data.answer) {
    const error = new Error("Failed to get a valid response from Dify API");
    error.status = 500;
    return next(error);
  }

  const answerMessage = response.data.answer;

  const botMessage = await Message.create({
    user: userId,
    isFromUser: false,
    message: answerMessage,
  });

  res.status(200).json(response.data);
});

export const getMessages = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const messages = await Message.find({ user: userId }).sort({
    timestamp: 1,
  });
  res.status(200).json(messages);
});

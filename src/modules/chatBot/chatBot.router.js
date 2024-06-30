import express from "express";
const router = express.Router();
import  * as chatController from"./chatBot.controller.js" 
import { isAthenticated } from "../../middleware/authentication.middleware.js";
import { isSubscribed } from "../../middleware/subscription.middleware.js";


router.post(
  "/send-message",
  isAthenticated,
  isSubscribed,
  chatController.sendMessage
);
router.get("/messages",isAthenticated, isSubscribed,chatController.getMessages);
export default router;

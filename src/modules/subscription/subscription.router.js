import express from "express";
import * as subController from "./subscription.controller.js";
import { isAthenticated } from "../../middleware/authentication.middleware.js";

const router = express.Router();

// Create Stripe Checkout Session
router.post(
  "/create-checkout-session",
  isAthenticated,
  subController.createCheckoutSession
);

// Webhook to handle subscription status updates
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  subController.handleWebhook
);

export default router;

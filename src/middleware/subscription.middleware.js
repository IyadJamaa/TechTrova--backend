import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../../DB/models/subscription.model.js";

export const isSubscribed = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({
    user: userId,
    status: "active",
    nextBillingDate: { $gte: new Date() }, 
  });

  if (!subscription) {
    return next(
      new Error("You need an active subscription to access this resource.", {
        cause: 403,
      })
    );
  }

  // Pass the subscription details to the request for further handling if needed
  req.subscription = subscription;

  return next();
});

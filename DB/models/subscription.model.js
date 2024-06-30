import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: { type: String, required: true },
    subscriptionId: { type: String, required: true },
    status: { type: String, default: "active" },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    nextBillingDate: { type: Date },
    stripeSubscriptionObject: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", subscriptionSchema);

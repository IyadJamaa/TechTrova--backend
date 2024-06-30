import Stripe from "stripe";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Subscription } from "../../../DB/models/subscription.model.js";
import { User } from "../../../DB/models/user.model.js";
import dotenv from "dotenv";
import { sendEmail } from "../../utils/sendEmails.js";
import { subscriptionSuccessTemplate } from "../../utils/htmlTemplates.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_KEY);

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const priceId = process.env.STRIPE_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: req.user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId.toString(), // Store the user ID in the metadata
    },
    success_url: `${process.env.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CANCEL_URL,
  });

  res.json({ url: session.url });
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
      const customer = await stripe.customers.retrieve(session.customer);
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );
      const userId = session.metadata.userId;

      const sub = await Subscription.create({
        user: userId,
        stripeCustomerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        stripeSubscriptionObject: subscription,
      });

      // Fetch user email
      const user = await User.findById(userId);
      const email = user.email;
      // Send subscription success email
      const subscriptionSuccessLink = `${process.env.SUCCESS_URL}?session_id=${session.id}`;
      const sentMessage = await sendEmail({
        to: email,
        subject: "Subscription Successful",
        html: subscriptionSuccessTemplate(subscriptionSuccessLink),
      });
      if (!sentMessage) {
        console.error("Failed to send subscription success email");
      }
      break;

    case "invoice.payment_succeeded":
      await Subscription.findOneAndUpdate(
        { stripeCustomerId: session.customer },
        { status: "active" }
      );
      break;

    case "customer.subscription.deleted":
      await Subscription.findOneAndUpdate(
        { stripeCustomerId: session.customer },
        { status: "canceled" }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

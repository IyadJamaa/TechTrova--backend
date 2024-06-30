import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./DB/connection.js";
import authRouter from "./src/modules/auth/auth.router.js";
import userRouter from "./src/modules/user/user.router.js";
import subRouter from "./src/modules/subscription/subscription.router.js";
import chatRouter from "./src/modules/chatBot/chatBot.router.js";
import cors from "cors";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const port = 3000;

// Connect to the database
await connectDb();

// CORS configuration
// const corsConfig = {
//   origin: "", // Add allowed origins here
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
// app.use(cors(corsConfig));
app.use(cors());
// app.options("", cors(corsConfig));

// Middleware for parsing JSON bodies
app.use((req, res, next) => {
  if (req.originalUrl === "/sub/webhook") {
    return next();
  }
  express.json()(req, res, next);
});

// Middleware for parsing raw bodies for Stripe webhooks
app.use("/sub/webhook", bodyParser.raw({ type: "application/json" }));

// Routers
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/sub", subRouter);
app.use('/chat', chatRouter);

// Page not found handler
app.all("*", (req, res, next) => {
  return next(new Error("Page not found", { cause: 404 }));
});

// Error handling middleware
app.use((error, req, res, next) => {
  const status = error.status || 500;
  res.status(status).json({ message: error.message });
});

// Global error handler
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message,
    stack: error.stack,
  });
});

// Start the server
app.listen(process.env.PORT || port, () => {
  console.log(`App is running at http://localhost:${process.env.PORT || port}`);
});

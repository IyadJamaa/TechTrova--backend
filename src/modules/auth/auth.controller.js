import { User } from "../../../DB/models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../utils/sendEmails.js";
import {
  restoreAccountTemplate,
  signUpTemp,
} from "../../utils/htmlTemplates.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Token } from "../../../DB/models/token.model.js";
import randomstring from "randomstring";

//register
export const register = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isDeleted: false });
  if (user) {
    const error = new Error("email already exists");
    error.status = 409;
    return next(error);
  }

  const token = jwt.sign(email, process.env.TOKEN_SECRET);
  await User.create({ ...req.body });
  const confirmatinLink = `https://tech-snowy.vercel.app/auth/activate_account/${token}`;
  const sentMessage = await sendEmail({
    to: email,
    subject: "activate account",
    html: signUpTemp(confirmatinLink),
  });
  if (!sentMessage) {
    const error = new Error("something went wrong");
    error.status = 500;
    return next(error);
  }
  return res.status(201).json({ success: true, message: "check your email!" });
});

//activate account
export const activateAccount = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const  email  = jwt.verify(token, process.env.TOKEN_SECRET);
  const user = await User.findOneAndUpdate({ email }, { isConfirmed: true });
  if (!user) return next(new Error("user not found "), { cause: 404 });
  return res.json({ success: true, message: "you can login now" });
});
//login
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    const error = new Error("user not found");
    error.status = 404;
    return next(error);
  }
  if (!user.isConfirmed) {
    const error = new Error("you must activate your account first");
    error.status = 403;
    return next(error);
  }
  const match = bcryptjs.compareSync(password, user.password);
  if (!match) {
    const error = new Error("incorrect password");
    error.status = 401;
    return next(error);
  }
  const token = jwt.sign({ email }, process.env.TOKEN_SECRET);
  await Token.create({ token, user: user._id });
  return res.status(201).json({ success: true, results: { token } });
});
//////////////////////forget code//////////////////////

export const sendForgetCode = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const error = new Error("user not found");
    error.status = 404;
    return next(error);
  }
  if (!user.isConfirmed) {
    const error = new Error("you must activate your account first!");
    error.status = 401;
    return next(error);
  }
  const code = randomstring.generate({
    length: 5,
    charset: "numeric",
  });
  user.forgetCode = code;
  await user.save();
  const messageSent = await sendEmail({
    to: user.email,
    subject: "forget password code",
    html: `<div>${code}</div>`,
  });
  if (!messageSent) {
    const error = new Error("email invalid!");
    error.status = 400;
    return next(error);
  }
  return res
    .status(201)
    .json({ success: true, message: "you can reset password now check email" });
});
//////////////////////reset password//////////////////////

export const resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new Error("email doesn't exist", { cause: 404 }));
  if (user.forgetCode != req.body.forgetCode) {
    return next(new Error("invalid code!"));
  }

  user.password = req.body.password;
  await user.save();
  // invalidate all tokens
  const tokens = await Token.find({ user: user._id });
  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });
  await User.findOneAndUpdate(
    { email: req.body.email },
    { $unset: { forgetCode: 1 } }
  );
  return res.json({ success: true, message: "you can login now" });
});

// Logout
export const logout = asyncHandler(async (req, res, next) => {
  const token = req.token;
  const isToken = await Token.findOneAndUpdate({ token }, { isValid: false });
  if (!isToken) return next(new Error("invalid token!"));
  // Send a response indicating successful logout
  res.json({ success: true, message: "Logout successful" });
});

// Update password
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  // Check if the user exists
  const user = await User.findById(req.user._id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    return next(err);
  }

  // Check if the old password matches
  const match = bcryptjs.compareSync(oldPassword, user.password);
  if (!match) {
    const err = new Error("Incorrect old password");
    err.status = 401;
    return next(err);
  }

  // Update the user's password
  user.password = newPassword;
  await user.save();
  // Invalidate all tokens associated with the deleted user
  const tokens = await Token.find({ user: req.user._id });
  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  res.status(200).json({ message: "Password updated successfully" });
});

// Soft delete user
export const softDeleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    return next(new Error("User not found"), { cause: 404 });
  }

  // Check if the logged-in user is an admin or the user themselves
  const currentUser = req.user;
  if (currentUser.role !== "admin" && currentUser._id.toString() !== userId) {
    return next(new Error("You are not allowed to do this!"), { cause: 403 });
  }

  // Soft delete the user
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    { isDeleted: true }
  );

  // Invalidate all tokens associated with the deleted user
  const tokens = await Token.find({ user: userId });
  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  res.json({ success: true, message: "User has been soft deleted" });
});

// Get active users
export const getActiveUsers = asyncHandler(async (req, res, next) => {
  const activeUsers = await User.find({ isDeleted: false });
  res.json({ success: true, users: activeUsers });
});

// Get deleted users
export const getDeletedUsers = asyncHandler(async (req, res, next) => {
  const deletedUsers = await User.find({ isDeleted: true });
  res.json({ success: true, users: deletedUsers });
});

// Restore user directly (admin only)
export const restoreUserDirectly = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findByIdAndUpdate(userId, { isDeleted: false });
  if (!user) {
    return next(new Error("User not found"), { cause: 404 });
  }
  res.json({
    success: true,
    message: "User has been restored directly by an admin.",
  });
});

// Request restore deleted user via email
export const requestRestoreUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isDeleted: true });
  if (!user) return next(new Error("User not found"), { cause: 404 });

  const token = jwt.sign({ email }, process.env.TOKEN_SECRET, {
    expiresIn: "1h",
  });
  const restoreLink = `http://localhost:3000/auth/restore_account/${token}`;
  const sentMessage = await sendEmail({
    to: email,
    subject: "Restore Account",
    html: restoreAccountTemplate(restoreLink),
  });
  if (!sentMessage) return next(new Error("Something went wrong"));

  return res.json({
    success: true,
    message: "Check your email to restore your account!",
  });
});
// Restore user from email link
export const restoreUserFromEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  let email;

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    email = decoded.email;
  } catch (err) {
    return next(new Error("Invalid or expired token"), { cause: 400 });
  }

  const user = await User.findOneAndUpdate(
    { email, isDeleted: true },
    { isDeleted: false }
  );
  if (!user) return next(new Error("User not found"), { cause: 404 });

  res.json({
    success: true,
    message: "User has been restored. You can now log in.",
  });
});

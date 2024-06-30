import { Subscription } from "../../../DB/models/subscription.model.js";
import { User } from "../../../DB/models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import cloudinary from "../../utils/cloud.js";

// get user data
export const userData = asyncHandler(async (req, res, next) => {
  const user = await User.findById(
    req.user._id,
    "userName email phone profileImage"
  );
  const sub =  await Subscription.findOne({user:req.user._id})
  return res.json({ success: true, results: { user,Subscription:sub } });
});
// Update profile
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { userName, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { userName, phone },
    { new: true }
  );
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    return next(error);
  }
  return res.json({ success: true, user });
});

// Upload profile image
export const uploadProfileImage = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!req.file) {
    const error = new Error("You must provide an image!");
    error.status = 401;
    return next(error);
  }

  const defaultImageId = "E_Commerce/users/defaults/profilePic/avatar_baqtea";
  if (user.profileImage.id && user.profileImage.id !== defaultImageId) {
    await cloudinary.uploader.destroy(user.profileImage.id);
  }

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: `${process.env.FOLDER_CLOUD_NAME}/users`,
  });

  user.profileImage = { url: result.secure_url, id: result.public_id };
  await user.save();

  return res.json({ success: true, user });
});

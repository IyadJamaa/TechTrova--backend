import { Router } from "express";
import { validation } from "../../middleware/validation.middleware.js";
import { isAuthorized } from "../../middleware/autherization.middileware.js";
import { isAthenticated } from "../../middleware/authentication.middleware.js";
import { fileUpload, filterObject } from "../../utils/multer.js";
import * as userController from "../user/user.controller.js";
import * as userSchema from "../user/user.schema.js";

const router = Router();

// get user data
router.get("/", isAthenticated, isAuthorized("user"), userController.userData);
// Update profile
router.patch(
  "/update_profile",
  isAthenticated,
  validation(userSchema.updateProfile),
  userController.updateProfile
);

// Upload profile image
router.patch(
  "/upload_profile_image",
  isAthenticated,
  fileUpload(filterObject.image).single("profileImage"),
  userController.uploadProfileImage
);


export default router;

import { Router } from "express";
import { validation } from "../../middleware/validation.middleware.js";
import * as authController from "./auth.controller.js";
import * as authSchema from "./auth.schema.js";
import { isAthenticated } from "../../middleware/authentication.middleware.js";
import { isAuthorized } from "../../middleware/autherization.middileware.js";

const router = Router();

// register
router.post(
  "/register",
  validation(authSchema.register),
  authController.register
);
//activate account
router.get(
  "/activate_account/:token",
  validation(authSchema.activateAccount),
  authController.activateAccount
);
//login
router.post("/login", validation(authSchema.login), authController.login);
// send forget code
router.patch(
  "/forget_code",
  validation(authSchema.forgetCodeSchema),
  authController.sendForgetCode
);

//reset password
router.patch(
  "/reset_password",
  validation(authSchema.resetPasswordSchema),
  authController.resetPassword
);
// Update password
router.patch(
  "/update_password",
  isAthenticated,
  validation(authSchema.updatePasswordSchema),
  authController.updatePassword
);
// Logout
router.post("/logout", isAthenticated, authController.logout);
// Soft delete user
router.patch(
  "/soft_delete/:userId",
  isAthenticated,
  isAuthorized("user", "admin"),
  validation(authSchema.softDeleteUser),
  authController.softDeleteUser
);

// Get active users
router.get(
  "/active_users",
  isAthenticated,
  isAuthorized("admin"),
  authController.getActiveUsers
);

// Get deleted users
router.get(
  "/deleted_users",
  isAthenticated,
  isAuthorized("admin"),
  authController.getDeletedUsers
);

// Route for admin to restore user directly
router.patch(
  "/restore_user_By_Admin/:userId",
  isAthenticated,
  isAuthorized("admin"),
  authController.restoreUserDirectly
);
//  request restore deleted user via email
router.post(
  "/request_restore_user",
  validation(authSchema.requestRestoreUser),
  authController.requestRestoreUser
);
//  restore user from email link
router.get(
  "/restore_account/:token",
  validation(authSchema.restore_account),
  authController.restoreUserFromEmail
);
export default router;

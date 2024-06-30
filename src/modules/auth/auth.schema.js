import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.middleware.js";

//register
export const register = joi
  .object({
    userName: joi.string().required().min(3).max(20).messages({
      "string.empty": `Username cannot be an empty field`,
      "string.min": `Username must be at least {#limit} characters long`,
      "string.max": `Username cannot be more than {#limit} characters long`,
      "any.required": `Username is a required field`,
    }),
    email: joi.string().email().required().messages({
      "string.empty": `Email cannot be an empty field`,
      "string.email": `Invalid email format`,
      "any.required": `Email is a required field`,
    }),
    password: joi.string().required().pattern(new RegExp(`^.{8,}$`)).messages({
      "string.empty": `Password cannot be an empty field`,
      "string.pattern.base": `Password must be at least 8 characters long`,
      "any.required": `Password is a required field`,
    }),
    confirmPassword: joi
      .string()
      .required()
      .valid(joi.ref("password"))
      .messages({
        "any.only": `Confirm password does not match password`,
        "any.required": `Confirm password is a required field`,
      }),
  })
  .required();

//activateAccount
export const activateAccount = joi
  .object({
    token: joi.string().required(),
  })
  .required();

//login
export const login = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  })
  .required();
// forget code

export const forgetCodeSchema = joi
  .object({
    email: joi.string().email().required(),
  })
  .required();
// reset password

  export const resetPasswordSchema = joi.object({
  email: joi.string().email().required().messages({
    "string.empty": `Email cannot be an empty field`,
    "string.email": `Invalid email format`,
    "any.required": `Email is a required field`,
  }),
  forgetCode: joi.string().length(5).required().messages({
    "string.empty": `Forget code cannot be an empty field`,
    "string.length": `Forget code must be exactly 5 characters long`,
    "any.required": `Forget code is a required field`,
  }),
  password: joi.string().required().pattern(new RegExp(`^.{8,}$`)).messages({
    "string.empty": `Password cannot be an empty field`,
    "string.pattern.base": `Password must be at least 8 characters long`,
    "any.required": `Password is a required field`,
  }),
  confirmPassword: joi.string().valid(joi.ref("password")).required().messages({
    "any.only": `Confirm password does not match password`,
    "any.required": `Confirm password is a required field`,
  }),
});

// Update password
export const updatePasswordSchema = joi.object({
  oldPassword: joi.string().required().messages({
    "string.empty": `Old password cannot be an empty field`,
    "any.required": `Old password is a required field`,
  }),
  newPassword: joi.string().required().pattern(new RegExp(`^.{8,}$`)).messages({
    "string.empty": `New password cannot be an empty field`,
    "string.pattern.base": `New password must be at least 8 characters long`,
    "any.required": `New password is a required field`,
  }),
  confirmPassword: joi.string()
    .valid(joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": `Confirm password does not match new password`,
      "any.required": `Confirm password is a required field`,
    }),
});
export const softDeleteUser = joi
  .object({
    userId: joi.string().custom(isValidObjectId),
  })
  .required();
  // request Restore User
 export const requestRestoreUser = joi
   .object({
     email: joi.string().email().required(),
   })
   .required();
   //restore account
  export const restore_account = joi
    .object({
      token: joi.string().required(),
    })
    .required();

  
import Joi from "joi";
import { isValidObjectId } from "../../middleware/validation.middleware.js";

export const userData = Joi.object({
  id: Joi.string().custom(isValidObjectId).required(),
}).required();
export const updateProfile = Joi.object({
  userName: Joi.string().min(3).max(20).required(),
  phone: Joi.string(),
});
   
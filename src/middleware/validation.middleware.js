import { Types } from "mongoose";

export const validation = (schema) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const validationResault = schema.validate(data, { abortEarly: false });
    if (validationResault.error) {
      const errorMessages = validationResault.error.details.map((errObj) => {
        return errObj.message;
      });
      const error = new Error(errorMessages);
      error.status = 400;
      return next(error);
    }
    return next();
  };
};
export const isValidObjectId = (value, helper) =>
  Types.ObjectId.isValid(value) ? true : helper.message("invalid object id");

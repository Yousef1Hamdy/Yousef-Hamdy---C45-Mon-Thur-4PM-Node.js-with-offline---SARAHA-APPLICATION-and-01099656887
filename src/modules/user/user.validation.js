import joi from "joi";
import { Types } from "mongoose";
import { generalValidationFields } from "../../common/index.js";

export const shareProfile = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id.required(),
    })
    .required(),
};

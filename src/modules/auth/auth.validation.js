import joi from "joi";
import { generalValidationFields } from "../../common/index.js";

export const login = {
  body: joi
    .object({
      email: generalValidationFields.email.required(),
      password: generalValidationFields.password.required(),
    })
    .required(),
};

export const signup = login.body.append({
  username: generalValidationFields.username.required(),
  phone: generalValidationFields.phone.required(),
  confirmPassword: generalValidationFields.confirmPassword("password").required(),
});

export const confirmEmail = joi.object().keys({
  email: generalValidationFields.email.required(),
  otp: generalValidationFields.otp.required(),
});

export const resendConfirmEmail = joi.object().keys({
  email: generalValidationFields.email.required(),
});

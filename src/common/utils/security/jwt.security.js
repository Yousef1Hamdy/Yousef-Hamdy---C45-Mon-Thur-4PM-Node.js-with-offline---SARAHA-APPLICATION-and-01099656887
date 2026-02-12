import jwt from "jsonwebtoken";
import {
  JWT_EXPIRE_IN,
  JWT_SECRET_KEY,
} from "../../../../config/config.service.js";
import { ErrorException } from "../response/index.js";

export const generateToken = ({ payload, expiresIn = JWT_EXPIRE_IN } = {}) => {
  const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn });
  return token;
};

export const verifyToken = (token) => {
  if (!token) {
    throw ErrorException({ message: "missing token", cause: 400 });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw UnauthorizedException({ message: "Token expired" });
    }
    throw UnauthorizedException({ message: "invalid  token" });
  }
};

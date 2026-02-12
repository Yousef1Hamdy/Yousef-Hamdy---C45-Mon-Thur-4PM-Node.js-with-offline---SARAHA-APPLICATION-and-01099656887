import {
  UnauthorizedException,
  verifyToken,
} from "../common/index.js";

export const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log({authHeader});
    if (!authHeader) {
      throw UnauthorizedException({ message: "Unauthorized" });
    }
    const token = authHeader;
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw error;
  }
};

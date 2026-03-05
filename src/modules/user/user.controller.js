import { Router } from "express";
import { profile, rotateToken, shareProfile } from "./user.service.js";
import { endpoint } from "./user.authorization.js";
import {
  authentication,
  authorization,
} from "../../middleware/userAuth.middleware.js";
import { TokenTypeEnum, successResponse } from "../../common/index.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
const router = Router();

router.get(
  "/",
  authentication(TokenTypeEnum.access),
  authorization(endpoint.profile),
  async (req, res, next) => {
    const account = await profile(req.user);

    return res.status(200).json({ message: "Profile", account });
  },
);

router.get(
  "/:userId/share-profile",
  validation(validators.shareProfile),
  async (req, res, next) => {
    const userId = req.params.userId;
    const account = await shareProfile(userId);

    return res.status(200).json({ message: "Profile", account });
  },
);

router.post(
  "/rotate",
  authentication(TokenTypeEnum.refresh),
  async (req, res, next) => {
    const account = await rotateToken(
      req.user,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({
      res,
      status: 201,
      message: "",
      data: { account },
    });
  },
);
export default router;

import { Router } from "express";
import {
  profile,
  profileImage,
  profileCoverImage,
  rotateToken,
  shareProfile,
  logout,
} from "./user.service.js";
import { endpoint } from "./user.authorization.js";
import {
  authentication,
  authorization,
} from "../../middleware/userAuth.middleware.js";
import {
  TokenTypeEnum,
  fileFieldValidation,
  localFileUpload,
  successResponse,
} from "../../common/index.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
const router = Router();

router.post("/logout", authentication(), async (req, res, next) => {
  const status = await logout(req.body, req.user, req.decoded);

  return successResponse({ res, status });
});

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

router.patch(
  "/profile-image",
  authentication(),
  localFileUpload({
    customPath: "users/profile",
    validation: fileFieldValidation.image,
    maxSize: 5,
  }).single("attachment"),
  validation(validators.profileImage),
  async (req, res, next) => {
    const account = await profileImage(req.file, req.user);
    return successResponse({
      res,
      data: { account },
    });
  },
);

router.patch(
  "/profile-cover-image",
  authentication(),
  localFileUpload({
    customPath: "users/profile/cover",
    validation: fileFieldValidation.image,
    maxSize: 5,
  }).array("attachments", 5),
  validation(validators.profileCoverImage),
  async (req, res, next) => {
    const account = await profileCoverImage(req.files, req.user);
    return successResponse({
      res,
      data: { account },
    });
  },
);

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.refresh),
  async (req, res, next) => {
    const credentials = await rotateToken(
      req.user,
      req.decoded,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({
      res,
      status: 201,
      message: "",
      data: { ...credentials },
    });
  },
);
export default router;

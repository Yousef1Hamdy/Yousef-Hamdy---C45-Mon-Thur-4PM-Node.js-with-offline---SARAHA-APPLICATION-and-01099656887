import { Router } from "express";
import { login, signup, signupWithGmail } from "./auth.service.js";
import { successResponse } from "../../common/index.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./auth.validation.js";
const router = Router();
router.post(
  "/signup",
  validation({ body: validators.signup }),
  async (req, res, next) => {
    const user = await signup(req.body);
    return successResponse({
      res,
      status: 201,
      message: "User created successfully",
      data: user,
    });
  },
);

router.post(
  "/login",
  validation({ body: validators.login }),
  async (req, res, next) => {
    const protocol = req.protocol; // http أو https
    const host = req.get("host");
    const issuer = `${protocol}://${host}`;

    const user = await login(req.body, issuer);
    return successResponse({
      res,
      message: "Done Login",
      data: user,
    });
  },
);

router.post("/signup/gmail", async (req, res, next) => {
  const protocol = req.protocol; // http أو https
  const host = req.get("host");
  const issuer = `${protocol}://${host}`;

  const { account, status = 201 } = await signupWithGmail(req.body, issuer);
  return successResponse({
    res,
    status,
    message: "Done ",
    data: { account },
  });
});

router.post("/login/gmail", async (req, res, next) => {
  const protocol = req.protocol; // http أو https
  const host = req.get("host");
  const issuer = `${protocol}://${host}`;

  const account = await loginWithGmail(req.body, issuer);
  return successResponse({
    res,
    message: "Done ",
    data: { account },
  });
});

export default router;

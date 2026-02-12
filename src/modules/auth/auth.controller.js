import { Router } from "express";
import { login, signup } from "./auth.service.js";
import { successResponse } from "../../common/index.js";
const router = Router();
router.post("/signup", async (req, res, next) => {
  const user = await signup(req.body);
  return successResponse({
    res,
    status: 201,
    message: "User created successfully",
    data: user,
  });
});

router.post("/login", async (req, res, next) => {
  const user = await login(req.body);
  return successResponse({
    res,
    message: "Done Login",
    data: user,
  });
});

export default router;

import { resolve } from "node:path";
import express from "express";
import cors from "cors";

import { port } from "../config/config.service.js";
import { globalErrorHandling } from "./common/index.js";
import { authentication, connectRedis } from "./DB/index.js";
import { authRouter, messageRouter, userRouter } from "./modules/index.js";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

async function bootstrap() {
  const app = express();
  //convert buffer data

  // cors origins
  const origins = ["http://127.0.0.1:5500", "http://127.0.0.1:4200", undefined];
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origins.includes(origin)) {
        callback(
          new Error("Not authorized origin", { cause: { status: 403 } }),
          origins,
        );
      } else {
        callback(null, origins);
      }
    },
  };

  const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: 10,
    legacyHeaders: true,
    // skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    handler: (req, res, next) => {
      return res.status(429).json({ message: "Too many requests" });
    },
    keyGenerator: (req, res, next) => {
      const ip = ipKeyGenerator(req.ip, 56);
      return `${ip}-${req.path}`;
    },
  });
  // app.set("trust proxy", true);
  app.use(cors(corsOptions), helmet(), limiter, express.json());
  app.use("/uploads", express.static(resolve("../uploads/")));
  // connecting DB
  await authentication();
  await connectRedis();
  //application routing
  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", messageRouter);

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //error-handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;

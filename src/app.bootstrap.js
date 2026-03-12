import { resolve } from "node:path";
import express from "express";
import cors from "cors";

import { port } from "../config/config.service.js";
import { globalErrorHandling } from "./common/index.js";
import { authentication, connectRedis } from "./DB/index.js";
import { authRouter, userRouter } from "./modules/index.js";

async function bootstrap() {
  const app = express();
  //convert buffer data

  app.use(cors(), express.json());
  app.use("/uploads", express.static(resolve("../uploads/")));
  // connecting DB
  await authentication();
  await connectRedis();
  //application routing
  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //error-handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;

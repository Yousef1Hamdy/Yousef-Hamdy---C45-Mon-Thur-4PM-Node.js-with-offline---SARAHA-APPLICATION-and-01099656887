import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { UserModel } from "./index.js";

export const authentication = async () => {
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 30000 });
    await UserModel.syncIndexes();
    console.log("DB connected successfully");
  } catch (error) {
    console.log(`fail to connected on database`);
  }
};

import {
  createLoginCredentials,
  decrypt,
  NotFoundException,
} from "../../common/index.js";
import { findOne, UserModel } from "../../DB/index.js";

export const profile = (user) => {
  return user;
};

export const shareProfile = async (userId) => {
  const account = await findOne({ model: UserModel, filter: { _id: userId } });
  if (!account) {
    throw NotFoundException({ message: "Invalid shared profile" });
  }

  if (account.phone) {
    account.phone = await decrypt(account.phone);
  }

  return account;
};

export const rotateToken = async (user, issuer) => {
  return createLoginCredentials(user, issuer);
};

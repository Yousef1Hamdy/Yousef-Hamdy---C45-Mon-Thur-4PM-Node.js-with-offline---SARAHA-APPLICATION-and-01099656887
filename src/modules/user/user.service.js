import {
  ACCESS_EXPIRE_IN,
  REFRESH_EXPIRE_IN,
} from "../../../config/config.service.js";
import {
  baseRevokeTokenKey,
  compareHash,
  ConflictException,
  createLoginCredentials,
  decrypt,
  deleteKey,
  generateHash,
  keys,
  LogoutEnum,
  NotFoundException,
  revokeTokenKey,
  set,
} from "../../common/index.js";
import { findOne, UserModel } from "../../DB/index.js";

const createRevokeToken = async ({ userId, jti, ttl } = {}) => {
  await set({
    key: revokeTokenKey({ userId, jti }),
    value: jti,
    ttl,
  });
};

export const logout = async ({ flag }, user, { jti, iat, sub }) => {
  let status = 200;
  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialTime = new Date();
      await user.save();
      await deleteKey(await keys(baseRevokeTokenKey(sub)));
      break;

    default:
      await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_EXPIRE_IN,
      });

      status = 201;
      break;
  }
  return status;
};

export const rotateToken = async (user, { jti, iat }, issuer) => {
  if ((iat + ACCESS_EXPIRE_IN) * 1000 > Date.now() + 30000) {
    throw ConflictException({ message: "Current access token stile valid" });
  }
  await createRevokeToken({
    userId: sub,
    jti,
    ttl: iat + REFRESH_EXPIRE_IN,
  });
  return createLoginCredentials(user, issuer);
};

export const profileImage = async (file, user) => {
  user.profilePicture = file.finalPath;
  await user.save();
  return user;
};

export const profileCoverImage = async (files, user) => {
  user.coverProfilePictures = files.map((file) => file.finalPath);
  await user.save();
  return user;
};

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

export const updatePassword = async (
  { oldPassword, password },
  user,
  issuer,
) => {

  console.log({oldPassword , password , user});
  if (
    !(await compareHash({ plaintext: oldPassword, cipherText: user.password }))
  ) {
    throw ConflictException({ message: "Invalid old password" });
  }

  for (const hash of user.oldPassword || []) {
    if (await compareHash({ plaintext: password, cipherText: hash })) {
      throw ConflictException({
        message: "This password is already used before",
      });
    }
  }

  user.oldPassword.push(user.password);
  user.password = await generateHash({ plaintext: password });
  user.changeCredentialTime = new Date();
  await user.save();

  await deleteKey(await keys(baseRevokeTokenKey(user._id)));
  return await createLoginCredentials(user, issuer);
};

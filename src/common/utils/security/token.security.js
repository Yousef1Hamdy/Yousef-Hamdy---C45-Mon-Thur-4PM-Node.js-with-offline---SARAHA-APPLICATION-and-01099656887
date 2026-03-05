import jwt from "jsonwebtoken";
import {
  ACCESS_EXPIRE_IN,
  REFRESH_EXPIRE_IN,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
  SYSTEM_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
  USER_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { BadRequestException, ErrorException, NotFoundException } from "../response/index.js";

import { AudienceEnum, TokenTypeEnum } from "../../enums/security.enum.js";
import { RoleEnum } from "../../enums/user.enum.js";
import { findOne } from "../../../DB/database.repository.js";
import { UserModel } from "../../../DB/index.js";

export const generateToken = ({
  payload,
  security = USER_TOKEN_SECRET_KEY,
  options = {},
} = {}) => {
  const token = jwt.sign(payload, security, options);
  return token;
};

export const getTokenSignature = async (role) => {
  let accessSignature = undefined;
  let refreshSignature = undefined;
  let audience = AudienceEnum.User;
  switch (role) {
    case RoleEnum.Admin:
      accessSignature = SYSTEM_TOKEN_SECRET_KEY;
      refreshSignature = SYSTEM_REFRESH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.System;
      break;

    default:
      accessSignature = USER_TOKEN_SECRET_KEY;
      refreshSignature = USER_REFRESH_TOKEN_SECRET_KEY;
      audience = AudienceEnum.User;
      break;
  }

  return { accessSignature, refreshSignature, audience };
};

export const getSignatureLevel = async (audienceType) => {
  let signatureLevel;
  switch (audienceType) {
    case AudienceEnum.System:
      signatureLevel = RoleEnum.Admin;
      break;

    default:
      signatureLevel = RoleEnum.User;
      break;
  }

  return { signatureLevel };
};

export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreshSignature, audience } =
    await getTokenSignature(user.role);

  const access_token = await generateToken({
    payload: { sub: user?._id.toString() },
    security: accessSignature,
    options: {
      issuer,
      expiresIn: ACCESS_EXPIRE_IN,
      audience: [TokenTypeEnum.access, audience],
    },
  });

  const refresh_token = await generateToken({
    payload: { sub: user?._id.toString() },
    security: refreshSignature,
    options: {
      issuer,
      expiresIn: REFRESH_EXPIRE_IN,
      audience: [TokenTypeEnum.refresh, audience],
    },
  });

  return {
    access_token,
    refresh_token,
  };
};

export const verifyToken = ({ token, secret = USER_TOKEN_SECRET_KEY } = {}) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw UnauthorizedException({ message: "Token expired" });
    }
    throw UnauthorizedException({ message: "invalid  token" });
  }
};

export const decodeToken = async ({
  token,
  tokenType = TokenTypeEnum.access,
} = {}) => {
  if (!token) {
    throw ErrorException({ message: "missing token", cause: 400 });
  }
  const decode = jwt.decode(token);
  if (!decode.aud?.length) {
    throw BadRequestException({
      message: "Fail to decode this token and is required ",
    });
  }
  const [decodeTokenType, audienceType] = decode.aud;
  console.log({decodeTokenType , tokenType});
  if (decodeTokenType !== tokenType) {
    throw BadRequestException({
      message: `Invalid token type token of type ${decodeTokenType} can't access this api while we expected token of type ${tokenType}`,
    });
  }
  const signatureLevel = await getSignatureLevel(audienceType);

  const { accessSignature, refreshSignature } =
    await getTokenSignature(signatureLevel);
  const verifyData = await verifyToken({
    token,
    secret:
      tokenType == TokenTypeEnum.access ? accessSignature : refreshSignature,
  });

  const user = await findOne({model : UserModel , filter : {_id : verifyData.sub}})

  if(!user){
    throw NotFoundException({message : "not Register account"})
  }
  return user
};

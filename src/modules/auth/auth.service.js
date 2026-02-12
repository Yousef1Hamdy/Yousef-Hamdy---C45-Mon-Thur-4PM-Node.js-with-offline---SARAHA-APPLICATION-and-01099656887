import {
  compareHash,
  ConflictException,
  decrypt,
  encrypt,
  generateHash,
  generateToken,
  NotFoundException,
} from "../../common/index.js";
import { createOne, findOne, UserModel } from "../../DB/index.js";

export const signup = async (inputs) => {
  const { username, email, password, gender, phone } = inputs;

  const checkUserFound = await findOne({ model: UserModel, filter: { email } });
  console.log({ checkUserFound });
  if (checkUserFound) {
    throw ConflictException({ message: "Email exist" });
  }
  const user = await createOne({
    model: UserModel,
    data: {
      username,
      email,
      password: await generateHash({ plaintext: password }),
      gender,
      phone: await encrypt(phone),
    },
  });
  return user;
};

export const login = async (inputs) => {
  const { email, password } = inputs;

  const user = await findOne({ model: UserModel, filter: { email } ,select : '+password'});
  console.log({ user });
  if (!user) {
    throw NotFoundException({ message: "invalid email or password" });
  }
  console.log({ plaintext: password, cipherText: user.password });
  const match = await compareHash({
    plaintext: password,
    cipherText: user.password,
  });

  if (!match) {
    throw NotFoundException({ message: "invalid email or password" });
  }

  const token = await generateToken({
    payload: { user_id: user?._id.toString() },
  });

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone ? await decrypt(user.phone) : null,
      gender: user.gender,
    },
    token,
  };
};

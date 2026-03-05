import {
  ACCESS_EXPIRE_IN,
  USER_TOKEN_SECRET_KEY,
} from "../../../config/config.service.js";
import {
  BadRequestException,
  compareHash,
  ConflictException,
  createLoginCredentials,
  decrypt,
  encrypt,
  generateHash,
  generateOTP,
  generateToken,
  NotFoundException,
  ProviderEnum,
  sendEmail,
  TokenTypeEnum,
} from "../../common/index.js";
import { createOne, findOne, UserModel, OtpModel } from "../../DB/index.js";
import { OAuth2Client } from "google-auth-library";

export const signup = async (inputs) => {
  const { username, email, password, gender, phone } = inputs;

  const checkUserFound = await findOne({ model: UserModel, filter: { email } });
  if (checkUserFound) {
    throw ConflictException({ message: "Email exist" });
  }
  const user = await createOne({
    model: UserModel,
    data: {
      ...inputs,
      username,
      email,
      password: await generateHash({ plaintext: password }),
      gender,
      phone: await encrypt(phone),
    },
  });

  await sendVerificationOTP(email);

  return user;
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;

  const user = await findOne({
    model: UserModel,
    filter: { email },
    select: "+password",
  });
  if (!user) {
    throw NotFoundException({ message: "invalid email or password" });
  }
  const match = await compareHash({
    plaintext: password,
    cipherText: user.password,
  });

  if (!match) {
    throw NotFoundException({ message: "invalid email or password" });
  }

  // if (!user.confirmEmail) {
  //   throw ConflictException({
  //     message: "Please verify your email first",
  //   });
  // }

  const { access_token, refresh_token } = await createLoginCredentials(
    user,
    issuer,
  );

  return {
    access_token,
    refresh_token,
  };
};

export const sendVerificationOTP = async (email) => {
  const otp = await generateOTP();

  const hashedOTP = await generateHash({ plaintext: otp });

  // delete old OTP first
  await OtpModel.deleteMany({ email });

  await createOne({
    model: OtpModel,
    data: {
      email,
      otp: hashedOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  const htmlTemplate = `
    <div style="font-family:Arial; text-align:center;">
      <h2>Verify Your Account</h2>
      <p>Your verification code is:</p>
      <div style="
        font-size:30px;
        font-weight:bold;
        letter-spacing:6px;
        color:#4f46e5;">
        ${otp}
      </div>
      <p>This code expires in 5 minutes.</p>
    </div>
  `;

  const sendOTP = await sendEmail({
    to: email,
    subject: "Email Verification Code",
    html: htmlTemplate,
  });
};

export const verifyEmail = async ({ email, otp }) => {
  const record = await findOne({
    model: OtpModel,
    filter: { email },
    options: { sort: { createdAt: -1 } },
  });

  if (!record) {
    throw NotFoundException({ message: "Invalid or expired OTP" });
  }

  const match = await compareHash({
    plaintext: otp,
    cipherText: record.otp,
  });

  if (!match) {
    throw NotFoundException({ message: "Invalid or expired OTP" });
  }

  await UserModel.updateOne({ email }, { confirmEmail: new Date() });

  await OtpModel.deleteMany({ email });

  return { message: "Email verified successfully" };
};

const verifyGoogleAccount = async (idToken) => {
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: [
      "445273522179-oqbkkanildgqjkp43vuuf54irf7k59g2.apps.googleusercontent.com",
    ],
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw BadRequestException({
      message: "Fail to verify this account with google",
    });
  }
  return payload;
};

export const signupWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);

  const checkUserExist = await findOne({
    model: UserModel,
    filter: { email: payload.email },
  });
  if (checkUserExist) {
    if (checkUserExist.provide == ProviderEnum.System) {
      throw ConflictException({
        message: "Account already exist with different provider",
      });
    }

    const account = await loginWithGmail(idToken, issuer);
    return { account, status: 200 };
  }

  const user = await createOne({
    model: UserModel,
    data: {
      firstName: payload?.given_name,
      lastName: payload?.family_name || " ",
      email: payload.email,
      provider: ProviderEnum.Google,
      profilePicture: payload.picture,
      confirmEmail: new Date(),
    },
  });

  return { account: await createLoginCredentials(user, issuer) };
};

export const loginWithGmail = async (idToken, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  const user = await findOne({
    model: UserModel,
    filter: { email: payload.email, provider: ProviderEnum.Google },
  });
  if (!user) {
    throw NotFoundException({
      message: "Invalid login credentials or Invalid login approach",
    });
  }

  return await createLoginCredentials(user, issuer);
};

/*
  payload: {
    iss: 'https://accounts.google.com',
    azp: '445273522179-oqbkkanildgqjkp43vuuf54irf7k59g2.apps.googleusercontent.com',
    aud: '445273522179-oqbkkanildgqjkp43vuuf54irf7k59g2.apps.googleusercontent.com',
    sub: '112858643601879853514',
    email: 'y5374036@gmail.com',
    email_verified: true,
    nbf: 1771949457,
    name: 'yousef hamdy',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocLrhmj6Aifc0dP5z1iIodVGZhRewnKczAj4aRWDj82kgwpjrg=s96-c',
    given_name: 'yousef',
    family_name: 'hamdy',
    iat: 1771949757,
    exp: 1771953357,
    jti: 'f969a19a1ee03cb93627725a71d0575ae6fbd104'
  }
*/

import {
  BadRequestException,
  compareHash,
  ConflictException,
  createLoginCredentials,
  deleteKey,
  emailEmitter,
  EmailEnum,
  emailTemplate,
  encrypt,
  generateHash,
  generateOTP,
  get,
  increment,
  keys,
  NotFoundException,
  otpBlockKey,
  otpKey,
  otpMaxRequestKey,
  ProviderEnum,
  sendEmail,
  set,
  ttl,
} from "../../common/index.js";
import { createOne, findOne, UserModel } from "../../DB/index.js";
import { OAuth2Client } from "google-auth-library";

export const verifyEmailOtp = async ({
  email,
  subject = EmailEnum.ConfirmEmail,
  title = "Verify Your Account",
} = {}) => {
  const blockKey = otpBlockKey({ email, type: subject });
  const remainBlockTimeOtp = await ttl(blockKey);
  if (remainBlockTimeOtp > 0) {
    throw ConflictException({
      message: `You have reached max request trail count please tray again after ${remainBlockTimeOtp} second`,
    });
  }

  // check max trail count
  const maxTrailCountKey = otpMaxRequestKey({ email, type: subject });
  const checkMaxOtpRequest = Number((await get(maxTrailCountKey)) || 0);

  if (checkMaxOtpRequest >= 3) {
    await set({
      key: otpBlockKey({ email, type: subject }),
      value: 0,
      ttl: 300,
    });
    throw ConflictException({
      message:
        "You have reached max request trail count please tray again after 300 second",
    });
  }

  checkMaxOtpRequest > 0
    ? await increment(maxTrailCountKey)
    : await set({ key: maxTrailCountKey, value: 1, ttl: 300 });

  const otp = await generateOTP();

  const hashedOTP = await generateHash({ plaintext: otp });

  await set({
    key: otpKey({ email, type: subject }),
    value: hashedOTP,
    ttl: 120,
  });

  await sendEmail({
    to: email,
    subject,
    html: emailTemplate({ otp, ttl: 2 * 60, title }),
  });
};

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

  emailEmitter.emit(EmailEnum.ConfirmEmail, async () => {
    await verifyEmailOtp({ email });
  });
  
  return user;
};

export const resendConfirmEmail = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }

  const remainTime = await ttl(otpKey(email));
  if (remainTime > 0) {
    throw ConflictException({
      message: `sorry we can't provider a new otp until exists one is expire you can try again later after ${remainTime} second`,
    });
  }

  await verifyEmailOtp({ email });

  return;
};

export const confirmEmail = async (inputs) => {
  const { email, otp } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "Fail to find matching account" });
  }

  const hashOtp = await get(otpKey(email));

  if (!hashOtp) {
    throw NotFoundException({ message: "Expired otp" });
  }

  const match = await compareHash({
    plaintext: otp,
    cipherText: hashOtp,
  });

  if (!match) {
    throw NotFoundException({ message: "Invalid or expired OTP" });
  }
  account.confirmEmail = new Date();
  await account.save();

  await deleteKey(await keys(otpKey(email)));

  return { message: "Email verified successfully" };
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;

  const user = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
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

  const { access_token, refresh_token } = await createLoginCredentials(
    user,
    issuer,
  );

  return {
    access_token,
    refresh_token,
  };
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

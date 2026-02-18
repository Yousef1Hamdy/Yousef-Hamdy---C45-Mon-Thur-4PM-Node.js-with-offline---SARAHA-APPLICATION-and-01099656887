import {
  compareHash,
  ConflictException,
  decrypt,
  encrypt,
  generateHash,
  generateOTP,
  generateToken,
  NotFoundException,
  sendEmail,
} from "../../common/index.js";
import { createOne, findOne, UserModel, OtpModel } from "../../DB/index.js";

export const signup = async (inputs) => {
  const { username, email, password, gender, phone } = inputs;

  const checkUserFound = await findOne({ model: UserModel, filter: { email } });
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

  await sendVerificationOTP(email);

  return user;
};

export const login = async (inputs) => {
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

  if (!user.confirmEmail) {
    throw ConflictException({
      message: "Please verify your email first",
    });
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

const sendVerificationOTP = async (email) => {
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

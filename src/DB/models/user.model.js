import mongoose from "mongoose";
import { GenderEnum, ProviderEnum } from "../../common/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "first name is required"],
      minLength: [2, "length must be greater than 2"],
      maxLength: 12,
      trim: true,
    },
    lastName: {
      type: String,
      maxLength: 12,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    phone: String,

    provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },
    gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.Male,
    },
    profilePicture: String,
    coverProfilePictures: [String],
    confirmEmail: Date,
    changeCredentialTime: Date,
  },
  {
    collection: "Users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

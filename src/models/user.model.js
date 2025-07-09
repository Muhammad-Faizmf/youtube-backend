const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      requried: [true, "Password is required"],
    },
    salt: {
      type: String,
      requried: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = crypto.pbkdf2Sync(
    this.password,
    crypto.randomBytes(8).toString("hex"),
    100000,
    64,
    "sha512"
  );
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();

  const salt = crypto.randomBytes(8).toString("hex");
  const hashedPassword = crypto
    .pbkdf2Sync(this.password, salt, 100000, 64, "sha512")
    .toString("hex");

  this.password = hashedPassword;
  this.salt = salt;

  next();
});

userSchema.methods.isPasswordCorrect = function (password) {
  const hashed = crypto
    .pbkdf2Sync(password, this.salt, 100000, 64, "sha512")
    .toString("hex");

  return this.password === hashed;
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

module.exports = { User };

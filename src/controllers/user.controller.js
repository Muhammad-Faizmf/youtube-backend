const { User } = require("../models/user.model");
const { uploadCloudinary } = require("../utils/cloudinary");

async function handleUserRegister(req, res) {
  // get the data from user frontend
  // validation - not empty
  // check if user already exist: username, email
  // check for images, avatar
  // upload images to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { userName, fullName, email, password, avatar } = req.body;

  try {
    if (!userName || !email || !fullName || !password) {
      return res.status(400).json({
        status: false,
        message:
          "All Fields (username, email, fullname, password avatar) are required.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { userName: userName.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "Username or email already exists.",
      });
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      return res.status(400).json({
        status: false,
        message: "Avatar file is required.",
      });
    }

    // Upload images to Cloudinary
    const avatarUrl = await uploadCloudinary(avatarLocalPath);
    const coverImageUrl = await uploadCloudinary(coverImageLocalPath);

    if (!avatarUrl) {
      return res.status(400).json({
        status: false,
        message: "Avatar cloud url is required.",
      });
    }

    const user = await User.create({
      fullName: fullName,
      userName: userName.toLowerCase(),
      avatar: avatarUrl?.url,
      coverImage: coverImageUrl?.url,
      email: email,
      password: password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -salt -refreshToken"
    );

    if (!createdUser) {
      return res.status(400).json({
        status: false,
        message: "Something went wrong while registering user.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "User registered successfully",
      data: createdUser,
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = { handleUserRegister };

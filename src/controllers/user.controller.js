const { User } = require("../models/user.model");
const { uploadCloudinary } = require("../utils/cloudinary");

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw console.log("Error while generating tokens: ", error);
  }
};

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

async function handleLoginUser(req, res) {
  // get email & password
  // validate - must not be empty
  // check the credentials in the database
  // if success then give tokens (access, refresh) and some other data
  // send cookies

  const { userName, email, password } = req.body;

  const user = await User.findOne({
    $or: [{ email }, { userName: userName.toLowerCase() }],
  });

  if (!user) {
    res.status(404).json({
      status: false,
      message: "User does not exist.",
    });
  }

  // Checking password & hash
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    res.status(401).json({
      status: false,
      message: "Invalid user credentials.",
    });
  }

  // Generating tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -salt -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: true,
      message: "Login successful",
      user: {
        accessToken,
        refreshToken,
      },
    });
}

async function handleLogoutUser(req, res) {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      status: true,
      message: "Logout successful",
    });
}

module.exports = { handleUserRegister, handleLoginUser, handleLogoutUser };

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

  const { userName, fullName, email } = req.body;

  if (!userName || !email) {
    return res.status(400).json({
      status: false,
      message: "All Fields (username, email, fullname, avatar) are required",
    });
  }

  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    return res.status(409).json({
      status: false,
      message: "User with email or username already exists",
    });
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    return res.status(400).json({
      status: false,
      message: "Avatar file is required.",
    });
  }

  // Upload images to cloudinary
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    return res.status(400).json({
      status: false,
      message: "Avatar cloud url is required.",
    });
  }

  const user = await User.create({
    fullName: fullName,
    username: userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
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

  return res.status(201).json({
    status: true,
    message: "User registered successfully",
  });
}

module.exports = { handleUserRegister };

const { User } = require("../models/user.model");
const { uploadCloudinary } = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

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
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      $or: [{ email }],
      // $or: [{ email }, { userName: userName.toLowerCase() }],
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
      secure: false, // make it true for production
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        status: true,
        message: "User logged in.",
        accessToken,
        refreshToken,
        user: loggedInUser,
      });
  } catch (error) {
    throw console.log("Error in login: ", error);
  }
}

async function handleLogoutUser(req, res) {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1, // this remove the field from document
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
        data: {},
        message: "User logged out.",
      });
  } catch (error) {
    throw console.log("Error logout: ", error);
  }
}

async function handleRefreshAccessToken(req, res) {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      res.status(401).json({
        status: false,
        message: "Unauthorized request.",
      });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      res.status(404).json({
        status: false,
        message: "Invalid refresh token.",
      });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      res.status(401).json({
        status: false,
        message: "Refresh token is expired or used.",
      });
    }

    const options = {
      httpOnly: true,
      secure: false, // make it true for production
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        status: true,
        message: "Access token refreshed.",
        accessToken,
        refreshToken: newRefreshToken,
      });
  } catch (error) {
    throw console.log("Error refreshing token: ", error);
  }
}

async function handleChangePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
      res.status(401).json({
        status: false,
        message: "Old Password is incorrect.",
      });
    }

    user.password = newPassword;
    user.salt = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    throw console.log("Error changing password: ", error);
  }
}

async function handleGetCurrentUser(req, res) {
  try {
    res.status(200).json({
      status: true,
      user: req.user,
      message: "Current user fetched successfully.",
    });
  } catch (error) {
    throw console.log("Error current user: ", error);
  }
}

async function handleUpdateAvatar(req, res) {
  try {
    const avatar = req.file?.path;

    if (!avatar) {
      res.status(401).json({
        status: false,
        message: "Avatar is missing.",
      });
    }

    const avatarUrl = await uploadCloudinary(avatar);

    if (!avatarUrl?.url) {
      return res.status(401).json({
        status: false,
        message: "Avatar cloud url is required.",
      });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: avatarUrl?.url,
        },
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      status: true,
      message: "Avatar uploaded successfully",
      filePath: avatarUrl?.url,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
}

async function handleUserSubscriberAndChannel(req, res) {
  const { userName } = req.query;

  if (!userName?.trim()) {
    res.status(401).json({
      status: false,
      message: "Username parameter is missing.",
    });
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.trim().toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        email: 1,
        userName: 1,
        fullName: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  if (!channel?.length) {
    res.status(401).json({
      status: false,
      message: "Channel does not exist.",
    });
  }

  return res.status(200).json({
    status: true,
    message: "User channel fetched successfully.",
    data: channel[0],
  });
}

async function handleUserGetWatchHistory(req, res) {
  const { id } = req.query;

  if (!id) {
    res.status(401).json({
      status: false,
      message: "User id parameter is missing.",
    });
  }

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    res.status(401).json({
      status: false,
      message: "User does not exist.",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Watch history fetched successfully.",
    data: user[0].watchHistory,
  });
}

module.exports = {
  handleUserRegister,
  handleLoginUser,
  handleLogoutUser,
  handleRefreshAccessToken,
  handleChangePassword,
  handleGetCurrentUser,
  handleUpdateAvatar,
  handleUserSubscriberAndChannel,
  handleUserGetWatchHistory,
};

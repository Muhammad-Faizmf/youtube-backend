const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");

const verifyJWT = async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized request.",
      });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -salt -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid access token.",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    throw console.log("Error: ", error);
  }
};

module.exports = { verifyJWT };

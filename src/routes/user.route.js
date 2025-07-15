const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { verifyJWT } = require("../middlewares/verify_jwt.middleware.js");
const {
  handleUserRegister,
  handleLoginUser,
  handleLogoutUser,
  handleRefreshAccessToken,
} = require("../controllers/user.controller");

const router = Router();

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  handleUserRegister
);

router.post("/login", handleLoginUser);

router.post("/logout", verifyJWT, handleLogoutUser);

router.post("/refresh-token", handleRefreshAccessToken);

module.exports = router;

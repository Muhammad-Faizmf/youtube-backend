const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { verifyJWT } = require("../middlewares/verify_jwt.middleware.js");
const {
  handleUserRegister,
  handleLoginUser,
  handleLogoutUser,
  handleRefreshAccessToken,
  handleChangePassword,
  handleGetCurrentUser,
  handleUpdateAvatar,
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

router.post("/login", upload.none(), handleLoginUser);

router.post("/logout", verifyJWT, upload.none(), handleLogoutUser);

router.post("/refresh-token", upload.none(), handleRefreshAccessToken);

router.post("/change-password", verifyJWT, upload.none(), handleChangePassword);

router.get("/get-current-user", verifyJWT, upload.none(), handleGetCurrentUser);

router.post(
  "/update-avatar",
  verifyJWT,
  upload.single("avatar"),
  handleUpdateAvatar
);

module.exports = router;

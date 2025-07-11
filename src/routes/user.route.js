const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { handleUserRegister } = require("../controllers/user.controller");

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

module.exports = router;

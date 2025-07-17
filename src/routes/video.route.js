const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { verifyJWT } = require("../middlewares/verify_jwt.middleware.js");
const { handleVideoUpload } = require("../controllers/video.controller");

const router = Router();

router.get(
  "/upload-video",
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  handleVideoUpload
);

module.exports = router;

const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { verifyJWT } = require("../middlewares/verify_jwt.middleware.js");
const {
  handleVideoUpload,
  handleMyVideos,
  handleAllVideos,
  handleIncrementCount,
} = require("../controllers/video.controller");

const router = Router();

router.post(
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

router.get("/my-vidoes", verifyJWT, upload.none(), handleMyVideos);

router.get("/all-videos", verifyJWT, upload.none(), handleAllVideos);
router.post("/increment-views", verifyJWT, upload.none(), handleIncrementCount);

module.exports = router;

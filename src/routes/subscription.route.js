const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { verifyJWT } = require("../middlewares/verify_jwt.middleware.js");
const {
  handleFetchSubscribers,
  handleAddSubscriber,
} = require("../controllers/subscription.controller");

const router = Router();

router.get("/get-subscriber", verifyJWT, upload.none(), handleFetchSubscribers);

router.post("/add-subscriber", verifyJWT, upload.none(), handleAddSubscriber);

module.exports = router;

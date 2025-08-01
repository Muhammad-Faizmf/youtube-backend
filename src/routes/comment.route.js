const { Router } = require("express");
const upload = require("../middlewares/multer.middleware");
const { verifyJWT } = require("../middlewares/verify_jwt.middleware.js");
const {
  handleAddComment,
  handleFetchComments,
} = require("../controllers/comment.controller");

const router = Router();

router.post("/add-comment", verifyJWT, upload.none(), handleAddComment);
router.get("/get-comments", verifyJWT, upload.none(), handleFetchComments);

module.exports = router;

const { Router } = require("express");
const { handleUserRegister } = require("../controllers/user.controller");

const router = Router();

router.get("/register", handleUserRegister);

module.exports = router;

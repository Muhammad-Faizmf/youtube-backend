require("dotenv").config();
const { app } = require("./app");
const userRouter = require("./routes/user.route");
const { connectDb } = require("./db/db_config");
const { verifyJWT } = require("./middlewares/verify_jwt.middleware");

// Mongodb connection
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`App listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Connection failed: ", err);
  });

app.use("/api/v1/users", userRouter);

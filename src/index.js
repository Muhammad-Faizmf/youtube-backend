require("dotenv").config();
const { app } = require("./app");
const userRouter = require("./routes/user.route");
const videoRouter = require("./routes/video.route");
const commentRoute = require("./routes/comment.route");
const subscriptionRoute = require("./routes/subscription.route");
const { connectDb } = require("./db/db_config");

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
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/subscription", subscriptionRoute);

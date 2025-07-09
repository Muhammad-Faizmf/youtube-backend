require("dotenv").config();
const { app } = require("./app");
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

app.get("/test", (req, res) => {
  res.send("Hello World!");
});



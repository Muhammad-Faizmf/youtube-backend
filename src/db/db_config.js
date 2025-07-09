const mongoose = require("mongoose");

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Mongodb Connected");
  } catch (error) {
    console.log("MongoDb Error: ", error);
    process.exit(1);
  }
}

module.exports = { connectDb };

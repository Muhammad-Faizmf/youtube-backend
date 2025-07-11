const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded on cloudinary: ", uploadResult.url);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the saved file locally
    console.log(error);
    return null;
  }
};

module.exports = {
  uploadCloudinary,
};

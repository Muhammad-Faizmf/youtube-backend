const { uploadCloudinary } = require("../utils/cloudinary");
const { Video } = require("../models/video.model");

async function handleVideoUpload(req, res) {
  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!(videoLocalPath && thumbnailLocalPath)) {
    return res.status(400).json({
      status: false,
      message: "video and thumbnail files are required.",
    });
  }

  console.log(videoLocalPath);
  console.log(thumbnailLocalPath);

  // uploading video and thumnail
  // const videoUploaded = await uploadCloudinary(videoLocalPath);
  // const thumbnailUploaded = await uploadCloudinary(thumbnailLocalPath);

  // if (!(videoUploaded?.url && thumbnailUploaded?.url)) {
  //   return res.status(401).json({
  //     status: false,
  //     message: "video or thumbnail url is not generated.",
  //   });
  // }

  // const video = await Video.create({
  //   videoFile: videoUploaded?.url,
  //   thumbnail: "here is the thumbnail",
  //   title: "This is first video",
  //   description: "This is description",
  //   duration: videoUploaded?.duration,
  //   owner: req.user?._id,
  // });

  // if (!video) {
  //   return res.status(401).json({
  //     status: false,
  //     message: "video is not added in the database.",
  //   });
  // }

  // return res.status(200).json({
  //   status: true,
  //   message: "Video uploaded successfully.",
  //   video: video,
  // });
}

module.exports = { handleVideoUpload };

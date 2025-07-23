const { uploadCloudinary } = require("../utils/cloudinary");
const { Video } = require("../models/video.model");

async function handleVideoUpload(req, res) {
  const { title, description } = req.body;

  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!(videoLocalPath && thumbnailLocalPath)) {
    return res.status(400).json({
      status: false,
      message: "video and thumbnail files are required.",
    });
  }

  // uploading video and thumnail
  const videoUploaded = await uploadCloudinary(videoLocalPath);
  const thumbnailUploaded = await uploadCloudinary(thumbnailLocalPath);

  if (!(videoUploaded?.url && thumbnailUploaded?.url)) {
    return res.status(401).json({
      status: false,
      message: "video or thumbnail url is not generated.",
    });
  }

  const video = await Video.create({
    videoFile: videoUploaded?.url,
    thumbnail: thumbnailUploaded?.url,
    title: title,
    description: description,
    duration: videoUploaded?.duration,
    owner: req.user?._id,
  });

  if (!video) {
    return res.status(401).json({
      status: false,
      message: "video is not added in the database.",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Video uploaded successfully.",
    video: video,
  });
}

async function handleMyVideos(req, res) {
  try {
    const videos = await Video.find({ owner: req.user._id });
    if (videos.length == 0) {
      return res.status(404).json({
        status: false,
        message: "No videos uploaded yet",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Videos fetched successfully",
      videos: videos,
    });
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { handleVideoUpload, handleMyVideos };

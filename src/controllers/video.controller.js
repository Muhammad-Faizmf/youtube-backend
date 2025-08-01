const { uploadCloudinary } = require("../utils/cloudinary");
const { Video } = require("../models/video.model");
const { User } = require("../models/user.model");

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

  // Fixed to decimal such as 15.99
  const formattedAsDecimal = videoUploaded?.duration.toFixed(2);

  const video = await Video.create({
    videoFile: videoUploaded?.url,
    thumbnail: thumbnailUploaded?.url,
    title: title,
    description: description,
    duration: formattedAsDecimal,
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

    // Aggregate to get subscribersCount and channelSubscribedToCount
    const [channelData] = await User.aggregate([
      {
        $match: {
          _id: req.user._id,
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" },
          channelSubscribedToCount: { $size: "$subscribedTo" },
        },
      },
      {
        $project: {
          subscribersCount: 1,
          channelSubscribedToCount: 1,
        },
      },
    ]);

    if (videos.length == 0) {
      return res.status(200).json({
        status: true,
        subscribersCount: channelData?.subscribersCount || 0,
        channelSubscribedToCount: channelData?.channelSubscribedToCount || 0,
        message: "No videos uploaded yet",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Videos fetched successfully",
      subscribersCount: channelData?.subscribersCount || 0,
      channelSubscribedToCount: channelData?.channelSubscribedToCount || 0,
      videos: videos,
    });
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleAllVideos(req, res) {
  try {
    const currentUserId = req.user?._id; // You must ensure this is populated via authentication middleware

    const videos = await Video.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      { $unwind: "$ownerDetails" },
      {
        $lookup: {
          from: "subscriptions",
          let: { channelId: "$owner" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$channel", "$$channelId"] },
              },
            },
            {
              $count: "subscriberCount",
            },
          ],
          as: "subscriberInfo",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          let: { channelId: "$owner" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$channel", "$$channelId"] },
                    { $eq: ["$subscriber", { $toObjectId: currentUserId }] },
                  ],
                },
              },
            },
          ],
          as: "isSubscribedInfo",
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $ifNull: [
              { $arrayElemAt: ["$subscriberInfo.subscriberCount", 0] },
              0,
            ],
          },
          isSubscribed: {
            $gt: [{ $size: "$isSubscribedInfo" }, 0],
          },
          userName: "$ownerDetails.userName",
          fullName: "$ownerDetails.fullName",
          avatar: "$ownerDetails.avatar",
        },
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          userName: 1,
          fullName: 1,
          avatar: 1,
          subscriberCount: 1,
          isSubscribed: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No videos found yet",
      });
    }

    return res.status(200).json({
      status: true,
      message: "All videos fetched successfully",
      videos: videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
}

async function handleIncrementCount(req, res) {
  const { videoId } = req.query;
  const { user } = req.user?._id;
  try {
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    res.status(200).json({
      status: true,
      message: "View counted",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  }
}

module.exports = {
  handleVideoUpload,
  handleMyVideos,
  handleAllVideos,
  handleIncrementCount,
};

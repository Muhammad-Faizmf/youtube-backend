const { Comment } = require("../models/comment.model");

async function handleAddComment(req, res) {
  const { content, video, commentBy } = req.body;

  try {
    if (!content || !video || !commentBy) {
      return res.status(400).json({
        status: false,
        message: "All Fields (content, video, & commentBy) are required",
      });
    }

    // Create the comment
    const comment = await Comment.create({
      content,
      video,
      commentBy,
    });

    if (!comment) {
      return res.status(401).json({
        status: false,
        message: "Something went wrong with Comment addition",
      });
    }

    // Fetch the comment with user info using aggregation
    const populatedComment = await Comment.aggregate([
      { $match: { _id: comment._id } },
      {
        $lookup: {
          from: "users", // Replace with your actual user collection name if different
          localField: "commentBy",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          content: 1,
          video: 1,
          commentBy: 1,
          createdAt: 1,
          userName: "$userInfo.userName", // top-level username
          avatar: "$userInfo.avatar", // top-level user avatar
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Comment submitted successfully",
      data: populatedComment[0],
    });
  } catch (error) {
    console.log("Error submitting comment: ", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

async function handleFetchComments(req, res) {
  const { videoId } = req.query;

  try {
    if (!videoId) {
      return res.status(400).json({
        status: false,
        message: "VideoId is required",
      });
    }

    const videoComments = await Comment.find({ video: videoId }).populate({
      path: "commentBy", // assumes 'commentBy' is a ref to User
      select: "userName avatar", // only fetch these fields
    });

    // if (!videoComments || videoComments.length === 0) {
    //   return res.status(404).json({
    //     status: false,
    //     message: "No comments found",
    //   });
    // }

    const formattedComments = videoComments.map((comment) => ({
      _id: comment._id,
      content: comment.content,
      createdAt: comment.createdAt,
      userName: comment.commentBy?.userName,
      avatar: comment.commentBy?.avatar,
    }));

    return res.status(200).json({
      status: true,
      message: "Comments fetched successfully",
      data: formattedComments,
    });
  } catch (error) {
    console.log("Error fetching comment:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

module.exports = { handleAddComment, handleFetchComments };

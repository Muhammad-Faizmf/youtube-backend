const mongoose = require("mongoose");
const commentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    commentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

commentSchema.plugin(aggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = { Comment };

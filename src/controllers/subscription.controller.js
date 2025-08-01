const { User } = require("../models/user.model");
const { Subscription } = require("../models/subscription.model");
const { mongoose } = require("mongoose");

async function handleFetchSubscribers(req, res) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    const loggedInUserId = new mongoose.Types.ObjectId(req.user?._id);

    const users = await User.aggregate([
      // Exclude the logged-in user
      {
        $match: {
          _id: { $ne: loggedInUserId },
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribersList",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$channel", "$$userId"] },
                    { $eq: ["$subscriber", loggedInUserId] },
                  ],
                },
              },
            },
          ],
          as: "isSubscribedArray",
        },
      },
      {
        $addFields: {
          isSubscribed: { $gt: [{ $size: "$isSubscribedArray" }, 0] },
          subscribers: { $size: "$subscribersList" },
        },
      },
      {
        $project: {
          id: "$_id",
          name: "$userName",
          avatar: 1,
          subscribers: 1,
          isSubscribed: 1,
        },
      },
    ]);

    res.status(200).json({
      status: true,
      message: "Users fetched with subscription info",
      data: users,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

async function handleAddSubscriber(req, res) {
  try {
    const id = req.user?._id;
    const { channel } = req.query;

    if (!channel) {
      return res.status(400).json({
        status: false,
        message: "Channel ID is required.",
      });
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      subscriber: id,
      channel: channel,
    });

    if (existingSubscription) {
      // Unsubscribe (remove the document)
      await Subscription.deleteOne({ _id: existingSubscription._id });

      return res.status(200).json({
        status: true,
        message: "Channel unsubscribed",
        isSubscribed: false,
      });
    } else {
      // Subscribe (create a new document)
      const newSubscription = await Subscription.create({
        subscriber: id,
        channel: channel,
      });

      return res.status(200).json({
        status: true,
        message: "Channel subscribed",
        isSubscribed: true,
        subscriber: newSubscription,
      });
    }
  } catch (error) {
    console.error("Error toggling subscription:", error.message);
    return res.status(500).json({
      status: false,
      message: "An error occurred while toggling the subscription.",
    });
  }
}

module.exports = {
  handleFetchSubscribers,
  handleAddSubscriber,
};

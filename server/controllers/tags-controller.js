const Tags = require("../models/tags-model");
const User = require("../models/user-model");
const Trade = require("../models/trade-model");
const mongoose = require("mongoose");

const FREE_TAG_LIMIT = 5;
const PRO_TAG_LIMIT = 50;

const createTag = async (req, res) => {
  try {
    const userId = req.userID;

    const { name, colour } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ message: "Tag name is required" });
    }

    // 1. Get user details
    const user = await User.findById(userId).select(
      "plan planExpiresAt activeAccountId",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get active accountId from user
    const accountId = user.activeAccountId;

    if (!accountId) {
      return res.status(400).json({
        message: "No active account selected",
      });
    }

    // 3. Check plan validity
    const isPro =
      user.plan === "pro" &&
      user.planExpiresAt &&
      new Date(user.planExpiresAt) > new Date();

    // 4. Count existing tags for this user + account
    const totalTags = await Tags.countDocuments({
      userId,
      accountId,
    });

    // 5. Enforce limits
    if (!isPro && totalTags >= FREE_TAG_LIMIT) {
      return res.status(403).json({
        message: "Free plan tag limit reached. Upgrade to Pro.",
      });
    }

    if (isPro && totalTags >= PRO_TAG_LIMIT) {
      return res.status(403).json({
        message: "Pro plan tag limit reached",
      });
    }
    const duplicateTag = await Tags.findOne({
      userId,
      accountId,
      name: name.trim(),
    });

    if (duplicateTag) {
      return res.status(400).json({
        message: "Tag name already exists in this account",
      });
    }
    // 6. Create tag
    const tag = await Tags.create({
      userId,
      accountId,
      name: name.trim(),
      colour,
    });

    return res.status(201).json({
      message: "Tag created successfully",
    });
  } catch (error) {
    console.error("createTag error:", error);
    return res.status(500).json({
      message: "Server error, failed to create tag",
      error: error.message || "Unknown error",
    });
  }
};

const getAllTag = async (req, res) => {
  try {
    const userId = req.userID;
    const user = await User.findById(userId).select("activeAccountId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accountId = user.activeAccountId;

    if (!accountId) {
      return res.status(400).json({
        message: "No active account selected",
      });
    }

    const tags = await Tags.find({ userId, accountId });
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ message: "fialed to get all tags" });
  }
};

const deleteTag = async (req, res) => {
  try {
    const tagId = req.params.id;
    const userId = req.userID || (req.user && req.user._id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Ensure the tag belongs to this user
    const tag = await Tags.findOne({ _id: tagId, userId });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    // 2. Remove tag from ALL trades of this user
    await Trade.updateMany(
      {
        userId: userId,
        tags: tagId, // only trades that contain this tag
      },
      {
        $pull: { tags: tagId },
      },
    );

    // 3. Delete the tag itself
    await Tags.deleteOne({ _id: tagId, userId });

    res.status(200).json({
      message: "Tag deleted and removed from all related trades",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete tag" });
  }
};

const updateTag = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedTag = req.body;
    const updateTag = await Tags.updateOne({ _id: id }, { $set: updatedTag });
    res.status(200).json({ message: "tag updated succesfully" });
  } catch (error) {
    res.status(500).json({ message: "failed to update tag" });
  }
};

module.exports = { createTag, deleteTag, updateTag, getAllTag };

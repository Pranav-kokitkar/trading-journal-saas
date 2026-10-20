const mongoose = require("mongoose");
const User = require("../../models/user-model");
const ProGrant = require("../../models/pro-grant-model");
const {
  getActiveComplimentaryGrant,
  hasEffectiveProAccess,
  isPaidPro,
} = require("../../services/pro-access-service");

const REASONS = ["founder_owner", "friend", "beta_promotional"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getProManagement = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = { deleted: { $ne: true } };
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const activeGrantFilter = {
      revokedAt: null,
      $or: [{ duration: "lifetime" }, { expiresAt: { $gt: new Date() } }],
    };
    const [users, allUsers, grants, historyGrants] = await Promise.all([
      User.find(filter)
        .select("name email plan planExpiresAt")
        .sort({ email: 1 })
        .lean(),
      User.find({ deleted: { $ne: true } })
        .select("name email plan planExpiresAt")
        .lean(),
      ProGrant.find(activeGrantFilter).sort({ createdAt: -1 }).lean(),
      ProGrant.find()
        .populate("userId", "name email")
        .populate("history.adminId", "name email")
        .lean(),
    ]);

    const now = new Date();
    const activeByUser = new Map(
      grants.map((grant) => [String(grant.userId), grant]),
    );
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        const grant = activeByUser.get(String(user._id));
        const effectivePro = await hasEffectiveProAccess(user, now);
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          isPro: effectivePro,
          accessSource: isPaidPro(user, now)
            ? grant
              ? "Paid + Complimentary"
              : "Paid"
            : grant
              ? `Complimentary ${grant.duration}`
              : "None",
          grantId: grant?._id || null,
          grantDuration: grant?.duration || null,
          grantExpiration: grant?.expiresAt || null,
        };
      }),
    );

    const history = historyGrants
      .flatMap((grant) =>
        grant.history.map((entry) => ({
          _id: `${grant._id}-${entry.timestamp.toISOString()}`,
          user: grant.userId,
          action: entry.action,
          reason: entry.reason,
          admin: entry.adminId,
          timestamp: entry.timestamp,
        })),
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const allUsersWithAccess = await Promise.all(
      allUsers.map(async (user) => ({
        ...user,
        isPro: await hasEffectiveProAccess(user, now),
        paid: isPaidPro(user, now),
        grant: activeByUser.get(String(user._id)),
      })),
    );
    const complimentaryActive = allUsersWithAccess.filter((user) => user.grant);
    res.json({
      summary: {
        totalProUsers: allUsersWithAccess.filter((user) => user.isPro).length,
        paidProUsers: allUsersWithAccess.filter((user) => user.paid).length,
        lifetimeGrants: complimentaryActive.filter(
          (grant) => grant.grantDuration === "lifetime",
        ).length,
        temporaryGrants: complimentaryActive.filter(
          (grant) => grant.grantDuration === "temporary",
        ).length,
      },
      users: usersWithAccess,
      history,
    });
  } catch (error) {
    console.error("getProManagement error:", error);
    res.status(500).json({ message: "Failed to load Pro management" });
  }
};

const grantProAccess = async (req, res) => {
  try {
    const { email, duration, expiresAt, reason, note } = req.body;
    if (typeof email !== "string" || !email.trim() || email.length > 254) {
      return res
        .status(400)
        .json({ message: "A valid user email is required" });
    }
    if (!["lifetime", "temporary"].includes(duration))
      return res.status(400).json({ message: "Invalid grant duration" });
    if (!REASONS.includes(reason))
      return res.status(400).json({ message: "Invalid grant reason" });

    let parsedExpiration = null;
    if (duration === "temporary") {
      parsedExpiration = new Date(expiresAt);
      if (
        !expiresAt ||
        Number.isNaN(parsedExpiration.getTime()) ||
        parsedExpiration <= new Date()
      ) {
        return res
          .status(400)
          .json({ message: "Temporary grants require a future expiration" });
      }
    } else if (expiresAt) {
      return res
        .status(400)
        .json({ message: "Lifetime grants cannot have an expiration" });
    }

    const user = await User.findOne({
      email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" },
      deleted: { $ne: true },
    }).select("_id email");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (await getActiveComplimentaryGrant(user._id)) {
      return res
        .status(409)
        .json({ message: "User already has active complimentary Pro access" });
    }

    const grant = await ProGrant.create({
      userId: user._id,
      duration,
      expiresAt: parsedExpiration,
      reason,
      note: typeof note === "string" ? note.trim() : undefined,
      grantedBy: req.userID,
      history: [{ action: "grant", reason, adminId: req.userID, note }],
    });
    res.status(201).json({ grant });
  } catch (error) {
    console.error("grantProAccess error:", error);
    res.status(500).json({ message: "Failed to grant Pro access" });
  }
};

const revokeProAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user ID" });
    const grant = await getActiveComplimentaryGrant(userId);
    if (!grant)
      return res
        .status(404)
        .json({ message: "No active complimentary grant found" });

    const updated = await ProGrant.findOneAndUpdate(
      { _id: grant._id, revokedAt: null },
      {
        $set: { revokedAt: new Date(), revokedBy: req.userID },
        $push: {
          history: {
            action: "revoke",
            reason: grant.reason,
            adminId: req.userID,
          },
        },
      },
      { new: true },
    );
    if (!updated)
      return res.status(409).json({ message: "Grant was already revoked" });
    res.json({ message: "Complimentary Pro access revoked" });
  } catch (error) {
    console.error("revokeProAccess error:", error);
    res.status(500).json({ message: "Failed to revoke Pro access" });
  }
};

module.exports = { getProManagement, grantProAccess, revokeProAccess };

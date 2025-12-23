const Contact = require("../../models/contact-model");

const getAllContacts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all"; // open, in_progress, resolved, all

    // Build match filter
    let matchFilter = {};

    // Search filter
    if (search) {
      matchFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status !== "all") {
      matchFilter.status = status;
    }

    const result = await Contact.aggregate([
      { $match: matchFilter }, // Apply filters first
      {
        $facet: {
          contacts: [
            { $sort: { submittedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          stats: [
            {
              $group: {
                _id: null,
                totalContacts: { $sum: 1 },
                totalOpen: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "open"] }, 1, 0],
                  },
                },
                totalInProgress: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0],
                  },
                },
                totalResolved: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const contacts = result[0].contacts;
    const stats = result[0].stats[0] || {
      totalContacts: 0,
      totalOpen: 0,
      totalInProgress: 0,
      totalResolved: 0,
    };

    res.status(200).json({
      contacts,
      stats: {
        totalContacts: stats.totalContacts,
        totalOpen: stats.totalOpen,
        totalInProgress: stats.totalInProgress,
        totalResolved: stats.totalResolved,
      },
      pagination: {
        currentPage: page,
        limit,
        totalPages: Math.ceil(stats.totalContacts / limit),
      },
      filters: {
        search: search || null,
        status,
      },
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res
      .status(400)
      .json({ message: "Error while getting contacts", error: err.message });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1️⃣ Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Contact ID is required",
      });
    }

    // 2️⃣ Validate status
    const allowedStatuses = ["open", "in_progress", "resolved"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // 3️⃣ Update contact
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // 4️⃣ Not found check
    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // 5️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Contact status updated successfully",
      contact: updatedContact,
    });
  } catch (error) {
    console.error("Update contact status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteContactByID = async (req, res) => {
  try {
    const id = req.params.id;
    const contactData = await Contact.findById(id);
    if (contactData.status !== "resolved") {
      return res
        .stats(400)
        .json({ message: "cant delete if issue is not resolved" });
    }
    await Contact.deleteOne({ _id: id });
    res.status(200).json({ message: "conatact deleted" });
  } catch (error) {
    res.status(400).json({ message: "failed to delte contact from server" });
  }
};

module.exports = { getAllContacts, deleteContactByID, updateContactStatus };

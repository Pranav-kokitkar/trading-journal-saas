const Contact = require("../../models/contact-model");

const getAllContacts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find().skip(skip).limit(limit);
    const totalContacts = await Contact.countDocuments();
    const totalOpen = await Contact.countDocuments({ status: "open" });
    const totalInProgress = await Contact.countDocuments({
      status: "in_progress",
    });
    const totalResolved = await Contact.countDocuments({ status: "resolved" });

    res.status(200).json({
      contacts,
      stats: {
        totalContacts,
        totalOpen,
        totalInProgress,
        totalResolved,
      },
      pagination: {
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalContacts / limit),
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error while gettting contacts", error: err });
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

module.exports = { getAllContacts, deleteContactByID };

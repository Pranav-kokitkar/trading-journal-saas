const Contact = require("../../models/contact-model");

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error while gettting contacts", error: err });
  }
};

const deleteContactByID = async (req, res) => {
  try {
    const id = req.params.id;
    await Contact.deleteOne({ _id: id });
    res.status(200).json({ message: "conatact deleted" });
  } catch (error) {
    res.status(400).json({ message: "failed to delte contact from server" });
  }
};

module.exports = { getAllContacts, deleteContactByID };

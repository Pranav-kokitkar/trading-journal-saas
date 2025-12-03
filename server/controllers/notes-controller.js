const Notes = require("../models/notes-model");

const addNotes = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const userId = req.userID;
    await Notes.create({ title, description, userId });
    res.status(200).json({ message: "notes added" });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const userId = req.userID || (req.user && req.user._id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notes = await Notes.find({ userId });

    return res.status(200).json(notes);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get notes from server" });
  }
};

const deleteNoteByID = async (req, res) => {
  try {
    const id = req.params.id;
    await Notes.deleteOne({ _id: id });
    res.status(200).json({ message: "note delted" });
  } catch (error) {
    return res.status(400).json({ message: "failed to delte" });
  }
};

const editNoteByID = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedNote = req.body;
    const updateNote = await Notes.updateOne(
      { _id: id },
      { $set: updatedNote }
    );
    res.status(200).json(updateNote);
  } catch (error) {
    res.status(400).json({ message: "Failed to edit" });
  }
};

module.exports = { addNotes, getAllNotes, deleteNoteByID, editNoteByID };

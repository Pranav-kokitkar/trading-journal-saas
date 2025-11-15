const mongoose = require("mongoose");

const URI = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log("connection to db is successful");
  } catch (error) {
    console.log("eror while connecting to db..", error);
  }
};

module.exports = connectDB;

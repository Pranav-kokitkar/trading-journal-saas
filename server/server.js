require("dotenv").config();
const express = require("express");
const connectDB = require("./utils/db");
const authRoute = require("./routers/Auth-router");

const app = express();

app.use(express.json());

app.use("/api/auth/", authRoute);

PORT = 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("server is running at port 3000...");
  });
});

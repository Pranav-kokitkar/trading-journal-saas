require("dotenv").config();
const express = require("express");
const connectDB = require("./utils/db");
const cors = require("cors");
const authRoute = require("./routers/Auth-router");

const app = express();

//cors issue tackle
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET, POST, PATCH, DELETE, PUT, HEAD",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/auth/", authRoute);

PORT = 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("server is running at port 3000...");
  });
});

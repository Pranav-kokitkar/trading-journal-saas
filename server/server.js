require("dotenv").config();
const express = require("express");
const connectDB = require("./utils/db");
const cors = require("cors");
const authRoute = require("./routers/Auth-router");
const tradeRoute = require("./routers/Trade-router");
const notesRoute = require("./routers/Notes-router");
const userRoute = require("./routers/User-router");
const contactRoute = require("./routers/Contact-router");
const accountRoute = require("./routers/Account-router");
const errorMiddleware = require("./middleware/error-middleware");

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
app.use("/api/trades", tradeRoute);
app.use("/api/user", userRoute);
app.use("/api/notes", notesRoute);
app.use("/api/contact", contactRoute);
app.use("/api/account", accountRoute);
app.use(errorMiddleware);

PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("server is running at port 3000...");
  });
});

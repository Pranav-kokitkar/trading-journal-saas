const express = require("express");

const app = express();

PORT = 3000;

app.get("/", (req, res) => {
  res.status(200).send("hello");
});

app.listen(PORT, () => {
  console.log("server is running at port 3000...");
});

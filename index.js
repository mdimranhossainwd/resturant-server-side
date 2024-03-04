const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Resturant-Server is Currently Running");
});

app.listen(port, () => {
  console.log(`Resturan-Server is Currently Running On:- ${port}`);
});

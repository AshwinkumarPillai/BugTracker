const express = require("express");
const bodyParser = require("body-parser");
const bugRoutes = require("./src/routes/bug.routes");
const userRoutes = require("./src/routes/user.routes");
const projectRoutes = require("./src/routes/project.routes");
const mongoose = require("mongoose");
require("dotenv").config();

const cors = require("cors");

const server = express();
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.use(cors());
server.set("view engine", "ejs");
server.set("views", "./src/views");

server.use("/project", projectRoutes);
server.use("/user", userRoutes);
server.use("/bug", bugRoutes);

server.use("/schedule-pinger", (req, res) => {
  res.send("Thank you for keeping me alive pinger!\n-Bug Tracker");
});

const url = process.env.MONGODB_URI || `mongodb://localhost:27017/bug-tracker`;
const PORT = process.env.PORT || 3200;

// mongoose.Promise = global.Promise;
// mongoose.set("useNewUrlParser", true);
// mongoose.set("useFindAndModify", false);
// mongoose.set("useCreateIndex", true);
// mongoose.set("useUnifiedTopology", true);

mongoose.connect(url, () => {
  server.listen(PORT);
  console.log("Connection established succesfully \nStanding By...");
});

module.exports = server;

const express = require("express");
const bodyParser = require("body-parser");
const bugRoutes = require("./src/routes/bug.routes");
const userRoutes = require("./src/routes/user.routes");
const projectRoutes = require("./src/routes/project.routes");
const mongoose = require("mongoose");

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

const url = process.env.MONGODB_URI || `mongodb://localhost:27017/bug-tracker`;

// mongoose.Promise = global.Promise;
// mongoose.set("useNewUrlParser", true);
// mongoose.set("useFindAndModify", false);
// mongoose.set("useCreateIndex", true);
// mongoose.set("useUnifiedTopology", true);

mongoose.connect(url, () => console.log("Connection established succesfully at", url, "\nStanding By..."));

module.exports = server;

import express from "express";
import bodyParser from "body-parser";
import bugRoutes from "../src/routes/bug.routes";
import userRoutes from "../src/routes/user.routes";
import projectRoutes from "../src/routes/project.routes";
const cors = require("cors");

const server = express();
server.use(bodyParser.json());
server.use(cors());
server.use("/project", projectRoutes);
server.use("/user", userRoutes);
server.use("/bug", bugRoutes);

export default server;

const mongoose = require("mongoose");
const BugModel = require("../models/bug");
const projectModel = require("../models/project");
const userProjectModel = require("../models/UserProject");
const userModel = require("../models/user");
const inboxModel = require("../models/inbox");
const inboxDispatcher = require("../events/inboxDispatcher");

module.exports.getAll = async (req, res) => {
  const projectId = req.body.projectId;
  const project = await projectModel.findById(projectId);
  let bugs;
  if (project.bugAssigned.length !== 0) {
    bugs = await BugModel.find({
      _id: {
        $in: project.bugAssigned,
      },
    });
  }
  if (bugs.length === 0) return res.json({ message: "No bugs in this project" });
  return res.json({ bugs });
};

module.exports.createBug = async (req, res) => {
  const user = req.user;
  const sourceId = user._id;
  const projectId = req.body.projectId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const status = req.body.status;
  const priority = req.body.priority;
  const screenShot = req.body.screenShot;
  let deadline = req.body.deadline;
  let getassignedDev = req.body.assignedDev;
  const createdBy = user._id;
  const watch_creator = req.body.watch;
  const creatorName = user.name;
  let assignedDev = [];
  if (getassignedDev.length !== 0) {
    getassignedDev.forEach((devId) => {
      let obj = {
        userId: devId,
        watch: 0,
      };
      assignedDev.push(obj);
    });
  }

  try {
    // let userProject = await userProjectModel.findOne({ userId: createdBy, projectId });
    // if (!userProject) return res.json({ message: "You are not a part of this project" });
    let project = await projectModel.findById(projectId);
    if (!project) return res.json("No project found");

    if (!deadline) deadline = "0000-01-01";

    const newBug = new BugModel({
      title,
      subtitle,
      status,
      priority,
      screenShot,
      deadline,
      assignedDev,
      createdBy,
      watch_creator,
    });

    let bug = await newBug.save();
    if (!bug) return res.json("Error in registering bug");
    let devIds = bug.assignedDev.map((obj) => obj.userId);
    let users = await userModel.find({
      _id: {
        $in: devIds,
      },
    });

    users.forEach(async (user) => {
      user.password = "";
      let inbox = new inboxModel({
        userId: user._id,
        projectId,
        bugId: bug._id,
        title: "New bug assigned",
        message:
          "A new bug was created and assigned to you by " + creatorName + " in project " + project.title,
        type: 2, // 1-proj, 2-bug-assigned ,3-bug-created/edit, 4-misc
        sourceName: creatorName, //Name
        sourceId,
        projName: project.title,
        read: 0,
      });
      await inbox.save();
    });

    project.bugAssigned.push(bug._id);
    let savedProject = await project.save();
    return res.json({ savedProject, bug, users });
  } catch (err) {
    console.log(err);
  }
};

module.exports.watchBug = async (req, res) => {
  const user = req.user;
  const userId = user._id;
  const bugId = req.body.bugId;
  try {
    let bug = await BugModel.findById(bugId);
    if (!bug) return res.json({ message: "Bug not found" });
    for (let i = 0; i < bug.assignedDev.length; i++) {
      if (JSON.stringify(bug.assignedDev[i].userId) == JSON.stringify(userId)) {
        bug.assignedDev[i].watch = 1;
        console.log("match Found");
        break;
      }
    }
    let updatedBug = await bug.save();
    return res.json({ updatedBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.edit = async (req, res) => {
  const user = req.user;
  const sourceId = user._id;
  const bugId = req.body.bugId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const status = req.body.status;
  const priority = req.body.priority;
  const screenShot = req.body.screenShot;
  const deadline = req.body.deadline;
  const projectId = req.body.projectId;
  const creatorName = user.name;
  const projectTitle = req.body.projectName;

  try {
    let bug = await BugModel.findById(bugId);
    bug.title = title;
    bug.subtitle = subtitle;
    bug.status = status;
    bug.priority = priority;
    bug.screenShot = screenShot;
    bug.deadline = deadline;
    let upBug = await bug.save();
    if (!upBug) return res.json("Error while updating bug");

    let data = {
      bugId: upBug._id,
      projectId,
      title: "Bug update",
      message: "Some changes were made to " + upBug.title,
      type: 3,
      creatorName,
      sourceId,
      projectTitle,
    };
    inboxDispatcher.emit("bugUpdateInbox", data);
    return res.json({ upBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.archive = async (req, res) => {
  const user = req.user;
  let bugId = req.body.bugId;
  const projectId = req.body.projectId;
  const projectTitle = req.body.projectName;

  try {
    let bug = await BugModel.findById(bugId);
    bug.archived = 1;
    let upBug = await bug.save();

    let data = {
      bugId: upBug._id,
      projectId,
      title: "Bug archived",
      message: user.name + " archived the bug " + upBug.title,
      type: 3,
      creatorName: user.name,
      sourceId: user._id,
      projectTitle,
    };
    inboxDispatcher.emit("bugUpdateInbox", data);
    return res.json({ upBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.solution = async (req, res) => {
  const user = req.user;
  const solution = req.body.solution;
  const projectId = req.body.projectId;
  const projectTitle = req.body.projectName;
  if (!solution) return res.json("Cannot store empty solution");
  const userId = user._id;
  const bugId = req.body.bugId;

  try {
    let bug = await BugModel.findById(bugId);
    bug.solution = solution;
    bug.solvedBy = userId;
    let upBug = await bug.save();
    let data = {
      bugId: upBug._id,
      projectId,
      title: "Bug solved",
      message: "Bug " + upBug.title + " was solved by " + user.name,
      type: 3,
      creatorName: user.name,
      sourceId: user._id,
      projectTitle,
    };
    inboxDispatcher.emit("bugUpdateInbox", data);
    return res.json({ upBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.AssignDev = async (req, res) => {
  const user = req.user;
  const sourceId = user._id;
  const sourceName = user.name;
  const bugId = req.body.bugId;
  const dev = req.body.dev;
  const projectId = req.body.projectId;
  const projectTitle = req.body.projectName;

  let assignedDev = [];
  dev.forEach((devId) => {
    let obj = {
      watch: 0,
      userId: devId,
    };
    assignedDev.push(obj);
  });
  try {
    let bug = await BugModel.findById(bugId);
    bug.assignedDev = assignedDev;
    let updatedBug = await bug.save();

    let users = await userModel.find({
      _id: {
        $in: dev,
      },
    });

    let data = {
      bugId: updatedBug._id,
      projectId,
      title: "Bug assigned",
      message: "A bug was assigned to you by " + sourceName + " in project " + projectTitle,
      type: 3,
      creatorName: sourceName,
      sourceId,
      projectTitle,
    };
    inboxDispatcher.emit("bugUpdateInbox", data);

    return res.json({ users, updatedBug });
  } catch (error) {
    console.log(error);
  }
};

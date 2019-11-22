import mongoose from "mongoose";
import BugModel from "../models/bug";
import projectModel from "../models/project";
import userProjectModel from "../models/UserProject";
import userModel from "../models/user";
import mail from "../services/mailService";

module.exports.getAll = async (req, res) => {
  const projectId = req.body.projectId;
  const project = await projectModel.findById(projectId);
  let bugs;
  if (project.bugAssigned.length !== 0) {
    bugs = await BugModel.find({
      _id: {
        $in: project.bugAssigned
      }
    });
  }
  if (bugs.length === 0) return res.json({ message: "No bugs in this project" });
  return res.json({ bugs });
};

module.exports.createBug = async (req, res) => {
  const user = req.user;
  const projectId = req.body.projectId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const status = req.body.status;
  const priority = req.body.priority;
  const screenShot = req.body.screenShot;
  const deadline = req.body.deadline;
  let getassignedDev = req.body.assignedDev;
  const createdBy = user._id;
  const watch_creator = req.body.watch;
  const email = user.email;
  let assignedDev = [];
  if (getassignedDev.length !== 0) {
    getassignedDev.forEach(devId => {
      let obj = {
        userId: devId,
        watch: 0
      };
      assignedDev.push(obj);
    });
  }

  try {
    // let userProject = await userProjectModel.findOne({ userId: createdBy, projectId });
    // if (!userProject) return res.json({ message: "You are not a part of this project" });
    let project = await projectModel.findById(projectId);
    if (!project) return res.json("No project found");

    const newBug = new BugModel({
      title,
      subtitle,
      status,
      priority,
      screenShot,
      deadline,
      assignedDev,
      createdBy,
      watch_creator
    });

    let bug = await newBug.save();
    if (!bug) return res.json("Error in registering bug");
    let devIds = bug.assignedDev.map(obj => obj.userId);
    let users = await userModel.find({
      _id: {
        $in: devIds
      }
    });
    users.forEach(obj => {
      obj.password = "";
    });
    let from = email;
    let to = users.map(obj => obj.email);
    let subject = "New bug assigned";
    let html = "You have been assigned a bug<br>Please check your project to know more";
    mail.sendMailService(from, to, subject, html);
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
    bug.assignedDev.forEach(dev => {
      if (dev.userId == userId) {
        dev.watch = 1;
      }
    });
    let updatedBug = await bug.save();
    return res.json({ updatedBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.edit = async (req, res) => {
  const user = req.user;
  const bugId = req.body.bugId;
  const title = req.body.title;
  const subtitle = req.body.subtitle;
  const status = req.body.status;
  const priority = req.body.priority;
  const screenShot = req.body.screenShot;
  const deadline = req.body.deadline;

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
    watchMail(upBug._id, user.email, "Bug update", "Some changes have been made to a bug that was assigned to you");
    return res.json({ upBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.archive = async (req, res) => {
  const user = req.user;
  let bugId = req.body.bugId;
  let userEmail = user.email;
  try {
    let bug = await BugModel.findById(bugId);
    bug.archived = 1;
    let upBug = await bug.save();
    // let subject = "bug  Update";
    // let html = "A bug has been archived by " + userEmail;
    // watchMail(upBug._id, userEmail, subject, html);
    return res.json({ upBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.solution = async (req, res) => {
  const user = req.user;
  const solution = req.body.solution;
  if (!solution) return res.json("Cannot store empty solution");
  const userId = user._id;
  // const userName = req.body.userName;
  const userEmail = user.email;
  const bugId = req.body.bugId;

  try {
    let bug = await BugModel.findById(bugId);
    bug.solution = solution;
    bug.solvedBy = userId;
    let upBug = await bug.save();
    let subject = "Bug solved";
    let html = "Your friend solved a bug. you can check the solution by logging in to bug tracker";
    watchMail(upBug._id, userEmail, subject, html);
    return res.json({ upBug });
  } catch (err) {
    console.log(err);
  }
};

module.exports.AssignDev = async (req, res) => {
  const user = req.user;
  const bugId = req.body.bugId;
  const dev = req.body.dev;
  const email = user.email;
  let assignedDev = [];
  dev.forEach(devId => {
    let obj = {
      watch: 0,
      userId: devId
    };
    assignedDev.push(obj);
  });
  try {
    let bug = await BugModel.findById(bugId);
    Array.prototype.push.apply(bug.assignedDev, assignedDev);

    let updatedBug = await bug.save();

    let users = await userModel.find({
      _id: {
        $in: dev
      }
    });
    users.forEach(obj => {
      obj.password = "";
    });
    let from = email;
    let to = users.map(obj => obj.email);
    let subject = "New bug assigned";
    let html = "You have been assigned a bug<br>Please check your project to know more";
    mail.sendMailService(from, to, subject, html);

    return res.json({ users, updatedBug });
  } catch (error) {
    console.log(error);
  }
};

module.exports.removeDev = async (req, res) => {
  const user = req.user;
  const bugId = req.body.bugId;
  const email = user.email;
  const dev = req.body.dev;

  try {
    let bug = await BugModel.findById(bugId);
    // dev =
    // bug.assignedDev.forEach(element => {

    // })

    // let updatedBug = await bug.save();

    // let users = await userModel.find({
    //   _id: {
    //     $in: dev
    //   }
    // });
    // users.forEach(obj => {
    //   obj.password = "";
    // });
    // let from = email;
    // let to = users.map(obj => obj.email);
    // let subject = "New bug assigned";
    // let html = "You have been assigned a bug<br>Please check your project to know more";
    // mail.sendMailService(from, to, subject, html);
    return res.json({ message: "hello" });
    // return res.json({ users, updatedBug });
  } catch (error) {
    console.log(error);
  }
};

async function watchMail(bugId, email, subject, html) {
  let bug = await BugModel.findById(bugId);
  let devs = bug.assignedDev.map(obj => {
    if (obj.watch == 1) return obj.userId;
  });

  devs = devs.filter(el => el != null);

  let users = await userModel.find({
    _id: {
      $in: devs
    }
  });
  users.forEach(obj => {
    obj.password = "";
  });

  let from = email;
  let to = users.map(obj => obj.email);
  mail.sendMailService(from, to, subject, html);
}

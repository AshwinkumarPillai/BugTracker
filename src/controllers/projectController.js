import projectModel from "../models/project";
import userProjectModel from "../models/UserProject";
import userModel from "../models/user";
import bugModel from "../models/bug";
import inboxModel from "../models/inbox";
import mongoose from "mongoose";
import removeBuddyfrombugs from "../events/inboxDispatcher";

module.exports.createProject = (req, res) => {
  const user = req.user;
  const title = req.body.title;
  const superAdmin = user._id;

  const newProject = new projectModel({
    title,
    superAdmin,
    bugAssigned: []
  });
  newProject
    .save()
    .then(project => {
      if (!project) return res.json("Project not saved");
      const newUserProject = new userProjectModel({
        projectId: project._id,
        userId: superAdmin,
        role: "owner",
        active: 1
      });

      newUserProject
        .save()
        .then(up => {
          if (!up) return res.json({ message: "Error in creating userProject" });
          return res.json({ up, project });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

module.exports.getAllUsers = async (req, res) => {
  const user = req.user;
  const projectId = req.body.projectId;
  try {
    let userProj = await userProjectModel
      .find({ projectId, active: 1 })
      .select("userId role")
      .populate("userId", "name email designation")
      .exec((err, users) => {
        return res.json({ users });
      });
  } catch (err) {
    console.log(err);
  }
};

module.exports.addBuddy = async (req, res) => {
  const user = req.user;
  const userId = user._id;
  const projectId = req.body.projectId;
  const projectName = req.body.projectName;
  const adminName = user.name;
  const newBuddy = req.body.newId;
  const role = req.body.role;
  const isNew = req.body.isNew;

  try {
    let exists = await userProjectModel.findOne({ userId: newBuddy, projectId });
    if (exists && isNew) {
      if (exists.active) {
        return res.json({ message: "This user is already present in your project" });
      } else {
        return res.json({ message: "Waiting for approval" });
      }
    }

    let checkuser = await userModel.findById(newBuddy);
    if (!checkuser) return res.json({ message: "No user Found", status: 404 });

    let userProj = await userProjectModel.findOne({ userId, projectId });
    if (!userProj) return res.json("Invalid request! Cannot get User-Project");
    if (userProj.role === "dev") return res.json("You are not authorized to perform this action");

    if (isNew) {
      let newUserProject = new userProjectModel({
        projectId: userProj.projectId,
        userId: newBuddy,
        role,
        active: 0,
        activationId: checkuser.email + "BIScHQAekqkD7jMFlpWz"
      });

      let BuddyAdded = await newUserProject.save();
      if (!BuddyAdded) return res.json({ message: "Error in creating new UserProj" });

      let inbox = new inboxModel({
        userId: BuddyAdded.userId,
        projectId,
        title: "Permission to accompany in project.",
        message: adminName + " wants you to be a part of a project entitled " + projectName,
        type: 1, // 1-proj, 2-bug-assigned ,3-bug-created/edit, 4-misc
        sourceName: adminName, //Name
        sourceId: userId,
        projName: projectName,
        read: 0
      });

      await inbox.save();
      return res.json({ BuddyAdded, newUserProject });
    } else {
      let newuserProj = await userProjectModel.findOne({ projectId: userProj.projectId, userId: newBuddy });
      if (!newuserProj) return res.json("Invalid request! Cannot get User-Project");
      if (newuserProj.role == "owner") {
        return res.json({ message: "You are not authorized to perform this action" });
      }
      newuserProj.role = role;
      let saveRole = newuserProj.save();
      if (!saveRole) return res.json("Error in saving role");
      return res.json(saveRole);
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.approveProject = async (req, res) => {
  const user = req.user;
  const projectId = req.body.projectId;
  const userId = req.body.recieverId;
  const inboxId = req.body.inboxId;
  const projectTitle = req.body.projectTitle;

  let userProj = await userProjectModel.findOne({ userId: user._id, projectId });
  if (!userProj) return res.json({ message: "Unexpected Error" });
  userProj.active = 1;
  await userProj.save();
  let inbox = new inboxModel({
    userId,
    projectId,
    title: "Invitation accepted",
    message: user.name + " accepted your offer to join project " + projectTitle,
    type: 4, // 1-proj, 2-bug-assigned ,3-bug/edit, 4-approved,5-error/security
    sourceName: user.name, //Name
    sourceId: user._id,
    projName: projectTitle,
    read: 0
  });
  await inbox.save();
  await inboxModel.findByIdAndRemove(inboxId);
  return res.json({ message: "Invitation accepted" });
};

module.exports.rejectProject = async (req, res) => {
  console.log("reject Project called");
  const user = req.user;
  const projectId = req.body.projectId;
  const userId = req.body.recieverId;
  const inboxId = req.body.inboxId;
  const projectTitle = req.body.projectTitle;

  await userProjectModel.findOneAndRemove({ userId: user._id, projectId });
  let inbox = new inboxModel({
    userId,
    projectId,
    title: "Invitation rejected",
    message: user.name + " rejected your offer to join project " + projectTitle,
    type: 6, // 1-proj, 2-bug-assigned ,3-bug-created/edit, 4-misc,5-error/security
    sourceName: user.name, //Name
    sourceId: user._id,
    projName: projectTitle,
    read: 0
  });
  await inbox.save();
  await inboxModel.findByIdAndRemove(inboxId);
  return res.json({ message: "Rejected project" });
};

module.exports.removeBuddy = async (req, res) => {
  const user = req.user;
  const adminName = user.name;
  const remove = req.body.remove;
  const projectId = req.body.projectId;
  let projName = req.body.projectName;
  let userId;
  let inbox;
  let projectMembers;

  if (remove) {
    userId = req.body.userId;
    let adminId = user._id;
    let adminProj = await userProjectModel.findOne({ userId: adminId, projectId });
    if (!adminProj) return res.json({ message: "No project Found!" });
    if (adminProj.role == "dev") return res.json({ message: "You are not authorized to perform this action" });

    inbox = new inboxModel({
      userId,
      projectId,
      title: "Removal from project",
      message: "Sorry we decided to remove you from our project",
      type: 5, // 1-proj, 2-bug-assigned ,3-bug-edit, 4-approved,5-error/security,6-rejected
      sourceName: adminName, //Name
      sourceId: adminId,
      projName,
      read: 0
    });
    await inbox.save();
  } else {
    userId = user._id;
    projectMembers = await userProjectModel.find({ projectId });
  }
  let tbduser = await userProjectModel({ userId, projectId });
  if (tbduser.role == "owner") return res.json({ message: "Can't remove the owner" });
  await userProjectModel.findOneAndRemove({ userId, projectId });
  if (projectMembers.length == 1) {
    let tobedeletedProject = await projectModel.findById(projectId);
    let allBugs = [];
    allBugs = tobedeletedProject.bugAssigned;
    removeBuddyfrombugs.emit("removeAllbugs", allBugs);
    await projectModel.findByIdAndRemove(projectId);
  }
  let data = {
    projectId,
    removalId: userId
  };
  removeBuddyfrombugs.emit("removefrombugs", data);
  return res.json({ message: "Removed successfully" });
};

module.exports.deleteProject = async (req, res, next) => {
  const user = req.user;

  const projectId = req.body.projectId;
  let project = await projectModel.findById(projectId);

  if (JSON.stringify(project.superAdmin) == JSON.stringify(user._id)) {
    await bugModel.deleteMany({
      _id: {
        $in: project.bugAssigned
      }
    });
    await projectModel.findByIdAndRemove(projectId);
    let user = await userProjectModel.deleteMany({ projectId });
    console.log(user);
    return res.json({ message: "Project deleted successfully", statusCode: 200 });
  } else {
    let inbox = new inboxModel({
      userId: project.superAdmin,
      projectId: project._id,
      title: "Security alert",
      message: user.name + " tried to delete your project:  " + project.title,
      type: 5, // 1-proj, 2-bug-assigned ,3-bug-created/edit, 4-misc,5-error/security
      sourceName: user.name, //Name
      projName: project.title,
      read: 0
    });
    await inbox.save();
    return res.json({
      message: "You are not authorized to perform this action",
      statusCode: 307
    });
  }
};

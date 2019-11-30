import projectModel from "../models/project";
import userProjectModel from "../models/UserProject";
import userModel from "../models/user";
import bugModel from "../models/bug";
import inboxModel from "../models/inbox";
import mongoose from "mongoose";
import mail from "../services/mailService";

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
    if (exists) return res.json({ message: "This user is already present in your project" });

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
        projName: projectName,
        read: 0
      });

      await inbox.save();
      return res.json({ BuddyAdded, newUserProject });
    } else {
      let newuserProj = await userProjectModel.find({ projectId: userProj.projectId, userId: newBuddy });
      if (!newuserProj) return res.json("Invalid request! Cannot get User-Project");
      newuserProj.role = role;
      let saveRole = newuserProj.save();
      if (!saveRole) return res.json("Error in saving role");
      return res.json(saveRole);
    }
  } catch (error) {
    console.log(error);
  }
};

// module.exports.verifybuddy = async (req, res) => {
//   try {
//     const activationId = req.query.id;
//     console.log(activationId);
//     let userProj = await userProjectModel.findOne({ activationId });
//     if (!userProj) return res.json("Invalid activation Id");
//     userProj.active = 1;
//     let updateUp = await userProj.save();
//     console.log(updateUp);
//     console.log("User Activation Successfull");
//     return res.json("Verification Successful!");
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports.approveProject = async (req, res) => {
  const user = req.user;
  const projectId = req.body.projectId;

  let userProj = await userProjectModel.findOne({ userId: user._id, projectId });
  if (!userProj) return res.json({ message: "Unexpected Error" });
  userProj.active = 1;
  await userProj.save();
  return res.json({ message: "Done" });
};

module.exports.rejectProject = async (req, res) => {
  const user = req.user;
  const projectId = req.body.projectId;

  await userProjectModel.deleteOne({ userId: user._id, projectId });
  return res.json({ message: "Rejected project" });
};

module.exports.removeBuddy = async (req, res) => {
  const user = req.user;
  const adminId = user._id;
  const adminName = user.name;
  const adminEmail = user.email;
  const userId = req.body.userId;
  const projectId = req.body.projectId;

  try {
    let adminProject = await userProjectModel.findOne({ userId: adminId, projectId });
    if (adminProject.role === "dev") return res.json("You are not authorized to perform this action. Only admins are allowed");
    let devProject = await userProjectModel.findOne({ userId, projectId });
    if (devProject.role === "admin") return res.json("You are not authorized to perform this action. The guy is also a admin");
    let userProject = await userProjectModel.findOneAndRemove({ userId, projectId });

    let buddy = await userModel.findById(userId);
    const from = '"' + adminName + '" ' + "<" + adminEmail + ">";
    const to = buddy.email;
    const subject = "Removal From Project";
    const html = "We are Sorry to Say, but we decided to remove you  from our Project";
    mail.sendMailService(from, to, subject, html);

    return res.json(userProject);
  } catch (error) {
    console.log(error);
  }
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
    await projectModel.deleteOne({ _id: projectId });
    await userProjectModel.deleteMany({ projectId });
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
    await user.save();
    return res.json({
      message: "You are not authorized to perform this action",
      statusCode: 307
    });
  }
};

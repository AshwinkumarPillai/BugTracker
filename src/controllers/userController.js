import userModel from "../models/user";
import projectModel from "../models/project";
import userProjectModel from "../models/UserProject";
import bugModel from "../models/bug";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

module.exports.login = async (req, res) => {
  const email = req.body.email;
  const secret = "sampleTest";
  try {
    let user = await userModel.findOne({ email });
    if (!user) return res.json({ message: "Email Not found" });
    let isEqual = bcrypt.compareSync(req.body.password, user.password);
    if (isEqual) {
      let token = jwt.sign(
        {
          id: user._id
        },
        secret
      );
      await user.save();
      return res.json({ message: "Logged in Succesfully.Hello " + user.name, token });
    }
    return res.json({ message: "Incorrect password" });
  } catch (err) {
    console.log(err);
  }
};

module.exports.registerUser = (req, res) => {
  userModel
    .findOne({ email: req.body.email })
    .then(user => {
      if (user) return res.json({ message: "Email Already registered!" });
      else {
        const hashedPassword = bcrypt.hashSync(req.body.password, 12);

        const newUser = new userModel({
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          contact: req.body.contact,
          designation: req.body.designation
        });

        newUser
          .save()
          .then(userDoc => {
            if (userDoc) {
              userDoc.password = "";
              return res.json({ message: "Registration Successful", userDoc });
            }
          })
          .catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
};

module.exports.editUsers = async (req, res) => {
  let user = req.user;
  let name = req.body.name;
  let email = req.body.email;
  let designation = req.body.designation;

  try {
    let upuser = await userModel.findById(user._id);
    if (!upuser) return res.json({ message: "No record found" });
    upuser.name = name;
    upuser.email = email;
    upuser.designation = designation;
    let update = await upuser.save();
    if (!update) return res.json({ message: "Couldn't update profile" });
    update.password = "";
    return res.json({ message: "Profile updated successfully!", update });
  } catch (err) {
    console.log(err);
  }
};

module.exports.getAllProjects = async (req, res) => {
  const user = req.user;
  try {
    let userProjects = await userProjectModel.find({ userId: user._id, active: 1 });
    if (userProjects.length == 0) return res.json({ message: "No Projects yet!" });
    let projIds = userProjects.map(obj => mongoose.Types.ObjectId(obj.projectId));
    let projects = await projectModel
      .find({
        _id: {
          $in: projIds
        }
      })
      .populate("superAdmin", "name email designation")
      .exec((err, projects) => {
        return res.json({ projects });
      });

    // console.log({ userProjects, projects });
  } catch (err) {
    console.log(err);
  }
};

module.exports.getOneProject = async (req, res) => {
  const user = req.user;
  const userId = user._id;
  const projectId = req.body.projectId;

  const project = await projectModel.findById(projectId).select("title bugAssigned");

  const userProject = await userProjectModel
    .find({ projectId })
    .select("userId role -_id")
    .populate("userId", "name email designation")
    .populate("solvedBy", "name email designation")
    .exec(async (err, users) => {
      let bugs = await bugModel
        .find({
          _id: {
            $in: project.bugAssigned
          },
          archived: 0
        })
        .populate("assignedDev.userId solvedBy", "name email designation");
      if (err) console.log(err);
      return res.json({ bugs, users, project });
    });
};

module.exports.getEveryUser = async (req, res) => {
  let Allusers = await userModel.find().select("name email designation");
  return res.json({ Allusers });
};

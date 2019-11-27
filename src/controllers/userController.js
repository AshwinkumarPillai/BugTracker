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
      let userdata = {
        name: user.name,
        email: user.email,
        designation: user.designation,
        github: user.github,
        twitter: user.twitter,
        portfolio: user.portfolio,
        linkedIn: user.linkedIn
      };
      return res.json({ message: "Logged in Succesfully.Hello " + user.name, token, userdata });
    }
    return res.json({ message: "Incorrect password" });
  } catch (err) {
    console.log(err);
  }
};

module.exports.registerUser = (req, res) => {
  if (!req.body.name || !req.body.email || !req.body.password || !req.body.contact || !req.body.designation)
    return res.json({ message: "Please fill all neccessary fields", status: -1 });
  userModel
    .findOne({ email: req.body.email })
    .then(user => {
      if (user) return res.json({ message: "Email Already registered!", status: -1 });
      else {
        const hashedPassword = bcrypt.hashSync(req.body.password, 12);

        const newUser = new userModel({
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          contact: req.body.contact,
          designation: req.body.designation,
          github: req.body.github,
          twitter: req.body.twitter,
          portfolio: req.body.portfolio,
          linkedIn: req.body.linkedIn
        });

        newUser
          .save()
          .then(userDoc => {
            if (userDoc) {
              return res.json({ message: "Registration Successful", status: 200 });
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
  let designation = req.body.designation;
  let github = req.body.github;
  let twitter = req.body.twitter;
  let portfolio = req.body.portfolio;
  let linkedIn = req.body.linkedIn;

  try {
    let upuser = await userModel.findById(user._id);
    if (!upuser) return res.json({ message: "No record found" });
    upuser.name = name;
    upuser.designation = designation;
    upuser.github = github;
    upuser.twitter = twitter;
    upuser.portfolio = portfolio;
    upuser.linkedIn = linkedIn;

    let update = await upuser.save();
    if (!update) return res.json({ message: "Couldn't update profile" });
    let userdata = {
      name: update.name,
      email: update.email,
      designation: update.designation,
      github: update.github,
      twitter: update.twitter,
      portfolio: update.portfolio,
      linkedIn: update.linkedIn
    };
    return res.json({ message: "Profile updated successfully!", userdata });
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

module.exports.viewProfile = async (req, res) => {
  let userId = req.body.userId;
  let user = await userModel.findById(userId).select("-password -contact");
  if (!user) return res.json({ status: 300 });
  return res.json({ user, status: 200 });
};

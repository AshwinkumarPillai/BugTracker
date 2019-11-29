import userModel from "../models/user";
import projectModel from "../models/project";
import userProjectModel from "../models/UserProject";
import bugModel from "../models/bug";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import mail from "../services/mailService";

module.exports.login = async (req, res) => {
  const email = req.body.email;
  const secret = "sampleTest";
  try {
    let user = await userModel.findOne({ email });
    if (!user) return res.json({ message: "Invalid Email or password" });
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
        _id: user._id,
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
    return res.json({ message: "Invalid Email or password" });
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

module.exports.forgotPassword = async (req, res) => {
  console.log("FGpassCalled");
  const email = req.body.email;
  let user = await userModel.findOne({ email });
  if (user) {
    const from = "BugTracker";
    const to = email;
    const subject = "Request to change password";
    const link = "http://" + req.get("host") + "/user" + "/change-pass?id=" + user._id;
    const html =
      "Click on the link to change your password.<br><a href=" +
      link +
      ">Click here to change your password</a><br><b>Note: please donot share this link with anyone!</b>";
    mail.sendMailService(from, to, subject, html);
  }
  res.json({ message: "A link has been provided to your email" });
};

module.exports.changePass = async (req, res) => {
  let user;
  const id = req.query.id;
  try {
    user = await userModel.findById(id);
  } catch (err) {
    return res.json("404");
  }
  if (!user) return res.send("404");
  res.render("fgpass", { id });
};

module.exports.changePassInDb = async (req, res) => {
  let userId = req.body.userId;
  let user = await userModel.findById(userId);
  if (user) {
    let password = req.body.password;
    if (/^\s*$/.test(password)) {
      const hashedPassword = bcrypt.hashSync(password, 12);
      user.password = hashedPassword;
      await user.save();
    }
  }
  res.redirect(301, "https://ash-bug-tracker.netlify.com/login");
  // res.redirect(301, "http://localhost:4200/login");
};

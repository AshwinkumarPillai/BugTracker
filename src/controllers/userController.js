import userModel from "../models/user";
import projectModel from "../models/project";
import userProjectModel from "../models/UserProject";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
const ObjectId = mongoose.Types.ObjectId;

module.exports.login = (req, res) => {
  const email = req.body.email;
  const secret = "sampleTest";

  userModel
    .findOne({ email })
    .then(user => {
      if (!user) return res.json({ message: "Email Not found" });
      let isEqual = bcrypt.compareSync(req.body.password, user.password);
      if (isEqual) {
        let token = jwt.sign(
          {
            id: user._id
          },
          secret
        );
        user.token = token;
        user.save();
        res.json({ message: "Logged in Succesfully", token });
      }
      return res.json({ message: "Incorrect password" });
    })
    .catch(err => console.log(err));
};

module.exports.registerUser = (req, res) => {
  userModel
    .findOne({ email: req.body.email })
    .then(user => {
      if (user) return res.json({ message: "User Already registered!" });
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
            if (userDoc) return res.json(userDoc);
          })
          .catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
};

module.exports.getAllProjects = async (req, res) => {
  const user = req.user;
  try {
    let userProjects = await userProjectModel.find({ userId: user._id });
    if (userProjects.length == 0) return res.json({ message: "No Projects Yet" });
    let projIds = userProjects.map(obj => mongoose.Types.ObjectId(obj.projectId));
    let projects = await projectModel.find({
      _id: {
        $in: projIds
      }
    });
    return res.json(userProjects, projects);
  } catch (err) {
    console.log(err);
  }
};

module.exports.getOneProject = (req, res) => {
  const user = req.user;
  const userId = user._id;
  const projectId = req.body.projectId;
  const UserProjectId = req.body.UserProjectId;

  userProjectModel
    .findOne({ userId, projectId })
    .then(userProject => {
      console.log(userProject);
      if (!userProject) return res.json("Not authorized to access project");
      projectModel
        .findById(userProject.projectId)
        .then(project => {
          if (!project) return res.json("Invalid Project");
          return res.json({ project, userProject });
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => console.log(err));
};

import userModel from "../models/user";
import jwt from "jsonwebtoken";

module.exports.checkToken = async (req, res, next) => {
  // console.log("Check Token called");
  const token = req.headers["x-auth"];
  const secret = "sampleTest";
  let decoded_token = jwt.verify(token, secret);
  let user = await userModel.findById(decoded_token.id);
  if (!user) return res.json({ message: "Authorization Error Please login again" });
  req.user = user;
  return next();
};

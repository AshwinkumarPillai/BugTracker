import userModel from "../models/user";

module.exports.checkToken = async (req, res, next) => {
  console.log("Check Token called");
  const token = req.headers["x-auth"];
  let user = await userModel.findOne({ token });
  if (!user) return res.json({ message: "Authorization Error Please login again" });
  req.user = user;
  return next();
};

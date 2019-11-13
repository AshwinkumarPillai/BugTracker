import userModel from "../models/user";

module.exports.checkToken = async (req, res) => {
  const token = req.headers["x-auth"];
  let user = await userModel.findOne({ token });
  if (!user) return res.json({ message: "Authoization Error Please login again" });
  req.user = user;
  next();
};

import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    contact: Number,
    designation: String,
    github: String,
    twitter: String,
    portfolio: String,
    linkedIn: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("user", userSchema);

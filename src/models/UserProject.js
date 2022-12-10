const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const ObjectId = Schema.Types.ObjectId;

const userProjectSChema = new Schema(
  {
    projectId: {
      type: ObjectId,
      ref: "project",
    },
    userId: {
      type: ObjectId,
      ref: "user",
    },
    role: {
      type: String,
      required: true,
    },
    active: {
      type: Number,
      default: 0,
    },
    activationId: {
      type: String,
      required: false,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("userProject", userProjectSChema);

const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const inboxSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: "user",
    },
    projectId: {
      type: ObjectId,
      ref: "project",
    },
    bugId: {
      type: ObjectId,
      ref: "bug",
    },
    title: {
      type: String,
      required: true,
    },
    message: String,
    type: Number, // 1-proj, 2-bug-assigned ,3-bug-edit, 4-approved,5-error/security,6-rejected
    sourceName: String, //Name
    sourceId: {
      type: ObjectId,
      ref: "user",
    },
    projName: String,
    read: {
      type: Number,
      default: 0,
      required: true,
    },
    newMessage: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("inbox", inboxSchema);

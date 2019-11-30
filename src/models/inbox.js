import mongoose, { Schema } from "mongoose";
const ObjectId = Schema.Types.ObjectId;

const inboxSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: "user"
    },
    projectId: {
      type: ObjectId,
      ref: "project"
    },
    bugId: {
      type: ObjectId,
      ref: "bug"
    },
    title: {
      type: String,
      required: true
    },
    message: String,
    type: Number, // 1-proj, 2-bug-assigned ,3-bug-created/edit, 4-misc
    sourceName: String, //Name
    projName: String,
    read: {
      type: Number,
      default: 0,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("inbox", inboxSchema);

import mongoose, { Schema } from "mongoose";
const ObjectId = Schema.Types.ObjectId;

const BugSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      required: true
    },
    priority: {
      type: String
    },
    archived: {
      type: Number,
      default: 0
    },
    screenShot: {
      type: String,
      default: ""
    },
    deadline: {
      type: Date,
      default: ""
    },
    solution: {
      type: String,
      default: ""
    },
    assignedDev: [
      {
        userId: {
          type: ObjectId,
          ref: "user"
        },
        watch: {
          type: Number,
          default: 0
        }
      }
    ],
    createdBy: {
      type: ObjectId,
      ref: "user"
    },
    watch_creator: {
      type: Number,
      default: 0
    },
    solvedBy: {
      type: ObjectId,
      ref: "user"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("bug", BugSchema);

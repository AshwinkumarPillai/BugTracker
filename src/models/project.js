import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    superAdmin: {
      type: Schema.Types.ObjectId,
      ref: "user"
    },
    bugAssigned: [
      {
        type: Schema.Types.ObjectId,
        ref: "bug"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("project", projectSchema);

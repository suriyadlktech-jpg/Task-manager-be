// models/Task.js
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    task_title: { type: String, required: true, trim: true },
    task_description: { type: String, trim: true },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // single user
    status: {
      type: String,
      enum: ["unassigned", "Accepted", "Rejected", "In Progress", "Completed"],
      default: "unassigned",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    due_date: { type: Date },
    client_name: { type: String, trim: true },
    project_name: { type: String, trim: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attachments: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema, "Tasks");

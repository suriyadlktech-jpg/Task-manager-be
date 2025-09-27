// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profile_pic: {
      type: String, // can store file path or cloud URL
      default: "",  // empty string if no profile pic uploaded
    },
    department: {
      type: String,
      trim: true,
      default: "",  // optional: empty string if not provided
    },
    task_status: {
      type: String,
      enum: ["Assigned", "Unassigned"],
      default: "Unassigned", // default value
    },
  },
  { timestamps: true }
);

// Explicit collection name
module.exports = mongoose.model("User", UserSchema, "Users");

const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completed: { type: Boolean, default: false },
    category: {
      name: { type: String, required: true },
      color: { type: String },
    },
    reminders: [
      {
        reminderDate: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", TaskSchema);

module.exports = { Task };

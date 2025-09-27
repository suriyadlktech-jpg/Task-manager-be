const Task =require("../Schema/taskSchema");
const calculatePriority=require("../Helper/calculateDate");
const sendMail = require("../utils/sendMail");
const User = require("../Schema/userSchema");


exports.createTask = async (req, res) => {
  try {
    const {
      task_title,
      task_description,
      assigned_to, // single user ID
      due_date,
      client_name,
      project_name,
      notes,
      attachments,
    } = req.body;
   console.log(assigned_to)
    const created_by = req.id;
   
    // ✅ Validate assigned user
    if (!assigned_to) {
      return res.status(400).json({ message: "Task must be assigned to a user" });
    }

    const user = await User.findById(assigned_to);
    if (!user) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    // Create new task for a single user
    const task = new Task({
      task_title,
      task_description,
      assigned_to, // single user
      due_date,
      client_name,
      project_name,
      created_by,
      notes,
      attachments,
      status: "Assigned", // since user is assigned
    });

    // Calculate priority based on dates
    task.priority = calculatePriority(task.createdAt, task.due_date);

    await task.save();

    // Update user's task status
    user.task_status = "Assigned";
    await user.save();

    // Send email to the assigned user
    await sendMail({
      to: user.email,
      subject: "New Task Assigned",
      text: `Hello ${user.username},\n\nYou have been assigned a new task: "${task_title}". Please check your dashboard for details.`,
    });

    res.status(201).json({ message: "Task created and user notified", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






exports.updateUserTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.id; // from JWT middleware

    const validStatus = ["Accepted", "Rejected", "In Progress", "Completed"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if the current user is assigned
    if (task.assigned_to?.toString() !== userId) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }

    // Update task status
    task.status = status;

    // If task is completed, unassign user and update user's task_status
    if (status === "Completed") {
      task.assigned_to = null; // unassign task

      const user = await User.findById(userId);
      if (user) {
        user.task_status = "Completed"; // mark user as unassigned
        await user.save();
      }
    }

    // Save task once
    await task.save();

    res.status(200).json({ message: `Task status updated to ${status}`, task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

















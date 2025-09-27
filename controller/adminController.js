
const User = require("../Schema/userSchema");
const Task = require ("../Schema/taskSchema");
const fs = require("fs");
const path = require("path");
const calculatePriority = require("../Helper/calculateDate");


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").lean();
    const userIds = users.map(u => u._id);

    const taskStats = await Task.aggregate([
      { $match: { assigned_to: { $in: userIds } } },
      {
        $group: {
          _id: { user: "$assigned_to", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {};
    taskStats.forEach(stat => {
      const userId = stat._id.user.toString();
      const status = stat._id.status;

      if (!statsMap[userId]) statsMap[userId] = { total: 0, completed: 0, inProgress: 0 };
      statsMap[userId].total += stat.count;
      if (status === "Completed") statsMap[userId].completed += stat.count;
      if (status === "In Progress") statsMap[userId].inProgress += stat.count;
    });

    // Get host dynamically
    const host = `${req.protocol}://${req.get('host')}`;

    const formattedUsers = users.map(user => {
      const stats = statsMap[user._id.toString()] || { total: 0, completed: 0, inProgress: 0 };
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        activeStatus: user.activeStatus || "Inactive",
        department: user.department || "Not Assigned",
        joinDate: user.createdAt,
        lastActive: user.lastLogin || null,
        profile_pic: user.profile_pic ? `${host}/${user.profile_pic}` : null,
        totalTasks: stats.total,
        completedTasks: stats.completed,
        inProgressTasks: stats.inProgress,
      };
    });

    res.status(200).json(formattedUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



exports.getDashboardStats = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Users
    const unassignedUsersCount = await User.countDocuments({ status: "unassigned" });
    const assignedUsersCount = await User.countDocuments({ status: "Assigned" });

    // Tasks
    const totalTasks = await Task.countDocuments();
    const inProgressTasks = await Task.countDocuments({ status: "In-Progress" });
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const pendingTasks = await Task.countDocuments({ status: "pending" });

    res.status(200).json({
      users: {
        unassigned: unassignedUsersCount,
        assigned: assignedUsersCount,
      },
      tasks: {
        total: totalTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        pending: pendingTasks,
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



exports.getTasks = async (req, res) => {
  try {
    const role = req.role;

    if (role !== "admin") {
      return res.status(403).json({ message: "Access denied, only admin can view all tasks" });
    }

    const tasks = await Task.find().populate("assigned_to", "username profile_pic");

    const updatedTasks = tasks.map((task) => ({
      task_name: task.task_title, 
      priority: calculatePriority(task.createdAt, task.due_date),
      status: task.status,
      due_date: task.due_date,
      assigned_user: task.assigned_to
        ? {
            username: task.assigned_to.username,
            profile_pic: task.assigned_to.profile_pic,
          }
        : null, // if unassigned
    }));

    res.status(200).json(updatedTasks);
  } catch (err) {
    console.error("Error fetching admin tasks:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete profile picture if exists
    if (user.profile_pic) {
      const filePath = path.join(__dirname, '..', 'uploads', user.profile_pic); // adjust path if needed
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete all tasks assigned to this user
    await Task.deleteMany({ assigned_to: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User, profile picture, and associated tasks deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};




exports.getRecentTasks = async (req, res) => {
  try {
    // Only admin can access
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Define your host URL (current server IP or domain)
    const HOST = req.get("host"); // gets current host from request headers
    const PROTOCOL = req.protocol; // http or https

    // Get recent tasks, sorted by creation date descending
    const tasks = await Task.find()
      .sort({ createdAt: -1 }) // latest first
      .limit(10) // latest 10 tasks
      .populate("assigned_to", "username profile_pic")
      .lean();

    const formattedTasks = tasks.map((task) => ({
      task_title: task.task_title,
      task_description: task.task_description,
      assigned_user: task.assigned_to
        ? {
            username: task.assigned_to.username,
            profile_pic: task.assigned_to.profile_pic
              ? `${PROTOCOL}://${HOST}/${task.assigned_to.profile_pic}`
              : "", // fallback if no profile_pic
          }
        : { username: "Unassigned", profile_pic: "" },
      priority: calculatePriority(task.createdAt, task.due_date),
      status: task.status,
      due_date: task.due_date,
    }));

    res.status(200).json(formattedTasks);
  } catch (err) {
    console.error("Error fetching recent tasks:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

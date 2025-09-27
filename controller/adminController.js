
const User = require("../Schema/taskSchema");
const Task = require ("../Schema/taskSchema")


exports.getAllUsers = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find().select("-password").lean();

    // Collect all user IDs
    const userIds = users.map((u) => u._id);

    // Aggregate tasks grouped by assigned_to and status
    const taskStats = await Task.aggregate([
      { $match: { assigned_to: { $in: userIds } } },
      {
        $group: {
          _id: { user: "$assigned_to", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a lookup for fast access
    const statsMap = {};
    taskStats.forEach((stat) => {
      const userId = stat._id.user.toString();
      const status = stat._id.status;

      if (!statsMap[userId]) {
        statsMap[userId] = {
          total: 0,
          completed: 0,
          inProgress: 0,
        };
      }

      statsMap[userId].total += stat.count;

      if (status === "Completed") {
        statsMap[userId].completed += stat.count;
      }
      if (status === "In Progress") {
        statsMap[userId].inProgress += stat.count;
      }
    });

    // Format final user data
    const formattedUsers = users.map((user) => {
      const stats = statsMap[user._id.toString()] || {
        total: 0,
        completed: 0,
        inProgress: 0,
      };

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        activeStatus: user.activeStatus || "Inactive",
        department: user.department || "Not Assigned",
        joinDate: user.createdAt,
        lastActive: user.lastLogin || null,
        profile_pic: user.profile_pic || null,
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
    const assignedUsersCount = await User.countDocuments({ status: "assigned" });

    // Tasks
    const totalTasks = await Task.countDocuments();
    const inProgressTasks = await Task.countDocuments({ status: "in-progress" });
    const completedTasks = await Task.countDocuments({ status: "completed" });
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
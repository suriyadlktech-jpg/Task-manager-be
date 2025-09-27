const Task = require("../Schema/taskSchema");

exports.getUserAssignedTasks = async (req, res) => {
  try {
    const  userId  = req.id;

    // Ensure only admin or the user themself can access
    if (req.user.role !== "admin" && req.user.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tasks = await Task.find({ assigned_to: userId })
      .populate("assigned_to", "username email profile_pic department")
      .populate("created_by", "username email profile_pic")
      .lean();

    const formattedTasks = tasks.map((task) => ({
      _id: task._id,
      task_title: task.task_title,
      task_description: task.task_description,
      priority: calculatePriority(task.createdAt, task.due_date),
      status: task.status,
      due_date: task.due_date,
      client_name: task.client_name,
      project_name: task.project_name,
      notes: task.notes,
      attachments: task.attachments,
      assigned_to: task.assigned_to
        ? {
            _id: task.assigned_to._id,
            username: task.assigned_to.username,
            email: task.assigned_to.email,
            profile_pic: task.assigned_to.profile_pic,
            department: task.assigned_to.department,
          }
        : null,
      created_by: task.created_by
        ? {
            _id: task.created_by._id,
            username: task.created_by.username,
            email: task.created_by.email,
            profile_pic: task.created_by.profile_pic,
          }
        : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    res.status(200).json(formattedTasks);
  } catch (err) {
    console.error("Error fetching user tasks:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



exports.getUserTaskCounts = async (req, res) => {
  try {
    const userId = req.id;

    // Find all tasks assigned to this user
    const tasks = await Task.find({ assigned_to: userId }).lean();

    let totalTasks = tasks.length;
    let assignedTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;

    tasks.forEach((task) => {
      if (["Pending", "Accepted"].includes(task.status)) assignedTasks += 1;
      if (task.status === "In Progress") inProgressTasks += 1;
      if (task.status === "Completed") completedTasks += 1;
      if (task.status === "Pending") pendingTasks += 1;
    });

    res.status(200).json({
      totalTasks,
      assignedTasks,
      inProgressTasks,
      completedTasks,
      pendingTasks,
    });
  } catch (err) {
    console.error("Error fetching task counts:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
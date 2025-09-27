const cron = require("node-cron");
const Task = require("../Schema/taskSchema");
const User = require("../Schema/userSchema");
const calculatePriority = require("../Helper/calculateDate");
const sendMail = require("../utils/sendMail");

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("Running cron job: updating task priorities...");

    const tasks = await Task.find();

    for (const task of tasks) {
      const newPriority = calculatePriority(task.createdAt, task.due_date);

      if (task.priority !== newPriority) {
        const oldPriority = task.priority;
        task.priority = newPriority;
        await task.save();

        console.log(`Updated task ${task._id} priority from ${oldPriority} to ${newPriority}`);

        // Notify the assigned user
        const user = await User.findById(task.assigned_to);
        if (user) {
          await sendMail({
            to: user.email,
            subject: `Task Priority Updated: ${task.task_title}`,
            text: `Hello ${user.username},\n\nThe priority of your assigned task "${task.task_title}" has changed from ${oldPriority} to ${newPriority}. Please check your dashboard for details.`,
          });
        }
      }
    }

    console.log("Task priority update completed.");
  } catch (err) {
    console.error("Error updating task priorities:", err);
  }
});

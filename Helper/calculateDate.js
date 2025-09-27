const calculatePriority = (createdAt, dueDate) => {
  if (!dueDate) return "Low";

  const now = new Date();
  const start = new Date(createdAt);
  const end = new Date(dueDate);

  const totalTime = end - start;
  const elapsed = now - start;

  if (elapsed <= 0.25 * totalTime) return "Low";
  if (elapsed <= 0.5 * totalTime) return "Medium";
  if (elapsed <= totalTime) return "High";
  return "Critical";
};

module.exports = calculatePriority;
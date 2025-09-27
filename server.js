const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // import cors
require("dotenv").config();
const root = require("./Root/root");
require("./Corn/updateTaskPriority");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(express.json());
app.use(cors()); // enable CORS for all routes

// ===== MongoDB connection =====
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===== Routes =====
app.use("/api", root);

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

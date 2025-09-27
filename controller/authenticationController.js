const jwt=require('jsonwebtoken');
const User = require('../Schema/userSchema');
const bcrypt=require('bcrypt');














exports.register = async (req, res) => {
  try {
    const { email, password, username, role, department } = req.body;

    // Check if user already exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    let profilePicData = "";
    if (req.file) {
   
      profilePicData = req.file.path || "";
    }

    // Save user
    const newUser = new User({
      email,
      username,
      role,
      department: department || "",
      password: hashPassword,
      profile_pic: profilePicData,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};









exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Respond with token and user info
    return res.status(200).json({
      token,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};
const User =require("../Schema/userSchema");





exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id; // get user ID from params
    const { username } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update username if provided
    if (username) {
      user.username = username;
    }

    // Update profile picture if file uploaded
    if (req.file) {
     
      user.profile_pic = req.file.buffer; 
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        userId: user._id,
        username: user.username,
        profile_pic: user.profile_pic, // can be URL or buffer
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

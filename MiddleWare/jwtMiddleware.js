

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Attach only required info to req.user
    
      req.id= decoded.userId,
      req.role = decoded.role,
    

    next();
  } catch (err) {
    console.error("JWT auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = auth;
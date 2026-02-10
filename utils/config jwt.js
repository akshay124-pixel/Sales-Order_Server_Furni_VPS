const jwt = require("jsonwebtoken");
const secretKey = require("../utils/config cypt");
function generateToken(user) {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, secretKey, { expiresIn: "30d" });
}

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res
      .status(403)
      .json({ message: "No token provided, access denied." });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Token verification failed. Token:", token);
    console.log("Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token.", error: error.message });
  }
};

module.exports = { generateToken, verifyToken };

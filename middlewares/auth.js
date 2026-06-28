import jwt from "jsonwebtoken";

// ==========================================
// TOKEN VALIDATION MIDDLEWARE
// ==========================================
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authorization token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "mykey");
    req.user = verified;
    return next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Authorization failed. Token is invalid or expired.",
    });
  }
};

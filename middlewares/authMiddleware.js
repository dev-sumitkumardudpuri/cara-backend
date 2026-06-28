import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================================
// AUTHENTICATION GUARD MIDDLEWARE
// ==========================================
export const protect = async (req, res, next) => {
  let token;

  // Validate presence and schema format of the authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract cryptographic token string from the header payload
      token = req.headers.authorization.split(" ")[1];

      // Decode and authenticate token credentials against internal signature secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Hydrate request context object with user data entity excluding password hash
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "The account associated with this token could not be located.",
        });
      }

      return next(); // Pass control to the subsequent middleware or controller layer
    } catch (error) {
      console.error("TOKEN_VERIFICATION_ERROR:", error.message);
      return res.status(401).json({
        success: false,
        message: "Authorization failed. Token is invalid or expired.",
      });
    }
  }

  // Handle unauthorized operations missing authorization tokens entirely
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No authorization token provided.",
    });
  }
};

// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ==========================================
export const adminCheck = (req, res, next) => {
  // Evaluate permission hierarchy context populated by preceding auth middleware
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Restricted to administrative accounts only.",
    });
  }
};

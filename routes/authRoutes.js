import express from "express";
import {
  signup,
  login,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  updateUserAddress,
} from "../controllers/authController.js";
import { protect, adminCheck } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================
router.post("/signup", signup);
router.post("/login", login);
router.post("/google-login", googleLogin);

// ==========================================
// PROTECTED USER ACCOUNT ENDPOINTS
// ==========================================
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/address", protect, updateUserAddress);

// Secure User Dashboard Route (Requires active session verification token)
router.get("/user-dashboard", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User dashboard access authorized.",
  });
});

// Secure Elevated Administrative Route (Requires valid authentication and admin scope role)
router.get("/admin-dashboard", protect, adminCheck, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Administrative dashboard access authorized.",
  });
});

export default router;

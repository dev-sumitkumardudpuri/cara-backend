import express from "express";
import {
  getAdminStats,
  getAllMessages,
  toggleMessageStatus,
  getAllOrders,
} from "../controllers/adminController.js";
import { protect, adminCheck } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Fetch comprehensive administrative dashboard metrics and recent telemetry data
router.get("/stats", protect, adminCheck, getAdminStats);

// Retrieve complete order registries for the administrative management subsystem
router.get("/orders", protect, adminCheck, getAllOrders);

// Retrieve all customer support messages and system inquiries
router.get("/messages", protect, adminCheck, getAllMessages);

// Toggle operational status (Read / Unread) for a specific system inquiry instance
router.patch("/messages/:id/status", protect, adminCheck, toggleMessageStatus);

export default router;

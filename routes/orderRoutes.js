import express from "express";
import {
  placeOrder,
  verifyStripeOrder,
  getMyOrders,
  cancelOrder,
  updateOrderStatus,
  processOrderRefund,
} from "../controllers/orderController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

// ==========================================
// CLIENT-FACING CUSTOMER ENDPOINTS
// ==========================================

// Initialize order creation workflows for both cash-on-delivery and online gateway procedures
router.post("/place", verifyToken, placeOrder);

// Process checkout session credentials to verify administrative Stripe payments status
router.post("/verify-stripe", verifyToken, verifyStripeOrder);

// Retrieve full processing order histories specific to the authenticated client instance
router.get("/myorders", verifyToken, getMyOrders);

// Execute request lifecycle parameters to trigger active transaction cancellation requests
router.put("/:id/cancel", verifyToken, cancelOrder);

// ==========================================
// ELEVATED ADMINISTRATIVE ENDPOINTS
// ==========================================

// Modify dispatch logistical metrics and global management status codes for a unique order ID
router.patch("/:id/status", verifyToken, updateOrderStatus);

// Execute financial transaction reversals and direct remote server API billing refunds
router.post("/:id/refund", verifyToken, processOrderRefund);

export default router;

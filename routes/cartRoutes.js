import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==========================================
// SECURE SHOPPING CART ROUTING
// ==========================================

// Merge guest cart with db cart on login
router.post("/merge", protect, mergeCart);

// Append new products or increment active inventory item quantity
router.post("/add", protect, addToCart);

// Retrieve active session cart details for the authenticated user
router.get("/", protect, getCart);

// Delete an explicit line item from the user cart instance using database product identifier mapping
router.delete("/remove/:productId", protect, removeFromCart);

// Purge the entire customer cart document repository context post-checkout allocation
router.delete("/clear-all", protect, clearCart);

export default router;

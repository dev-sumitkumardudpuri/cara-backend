import express from "express";
import { submitContactForm } from "../controllers/contactController.js";

const router = express.Router();

// ==========================================
// PUBLIC INQUIRY ROUTING
// ==========================================

// Handle contact form payload submissions and support requests
router.post("/", submitContactForm);

export default router;

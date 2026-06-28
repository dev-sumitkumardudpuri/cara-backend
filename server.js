import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load systemic environment variables into process.env configuration context
dotenv.config();

const app = express();

// ==========================================
// GLOBAL MIDDLEWARE CONFIGURATIONS
// ==========================================
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS Policy: This origin is not allowed"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// Initialize connection with the persistence database layer
connectDB();

// ==========================================
// ROOT BASE HEALTH CHECK ENDPOINT
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Application server is running operational status.",
  });
});

// ==========================================
// APPLICATION DISPATCHER ROUTING PIPELINES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// ==========================================
// RUNTIME INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `APPLICATION_SERVER_INITIALIZATION: Active and listening on port - ${PORT}`,
  );
});

import mongoose from "mongoose";

// ==========================================
// DATABASE CONFIGURATION ORCHESTRATION
// ==========================================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `DATABASE_INITIALIZATION_SUCCESSFUL: Connected to host cluster - ${conn.connection.host}`,
    );
  } catch (error) {
    console.error(`DATABASE_INITIALIZATION_FAILURE: ${error.message}`);
    // Terminate application process on critical database initialization failure
    process.exit(1);
  }
};

export default connectDB;

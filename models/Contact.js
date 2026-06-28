import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name field is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address field is required."],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, "Subject field is required."],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message payload field is required."],
      trim: true,
    },
    // Logistical state monitoring parameter to track administrative processing
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Contact", ContactSchema);

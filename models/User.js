import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name field is required."],
      trim: true,
      // Validation constraint: Restricts characters strictly to alphabets and white spaces
      validate: {
        validator: function (v) {
          return /^[A-Za-z\s]+$/.test(v);
        },
        message: "Name can only contain alphabetic characters and spaces.",
      },
    },
    email: {
      type: String,
      required: [true, "Email address field is required."],
      unique: true, // Enforces unique data constraints on systemic user accounts
      trim: true,
      lowercase: true,
      // Domain-specific regex validation targeting enterprise and mainstream email clients
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud|protonmail|\w+\.\w+)\.[a-zA-Z]{2,}$/.test(
            v,
          );
        },
        message: "Please enter a valid email address.",
      },
    },
    password: {
      type: String,
      // Conditional evaluation: Bypasses credential requirements for federated OAuth data streams
      required: function () {
        return !this.isGoogleUser;
      },
    },
    isGoogleUser: {
      type: Boolean,
      default: false, // Discovers standard credential registry versus federated authorization
    },
    role: {
      type: String,
      enum: ["user", "admin"], // Enforces strict Role-Based Access Control configuration scopes
      default: "user",
    },
    // Sub-document object to manage and persist user default shipping metrics
    savedAddress: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
  },
  {
    timestamps: true, // Automatically manages injection of 'createdAt' and 'updatedAt' field values
  },
);

const User = mongoose.model("User", userSchema);
export default User;

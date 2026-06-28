import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Generates a JSON Web Token for user authentication
 * @param {string} id - The user database document ID
 * @returns {string} JWT Token valid for 7 days
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ==========================================
// SIGNUP CONTROLLER
// ==========================================
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verify if account identifier already exists in database
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    // Server-side regex validation failsafe for sanitization
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud|protonmail|\w+\.\w+)\.[a-zA-Z]{2,}$/;

    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Name can only contain alphabetic characters and spaces.",
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Encrypt password payload before database entry
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Persist new user entity to database with default authorization scope
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// STANDARD CREDENTIALS LOGIN CONTROLLER
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check account existence against request payload
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // Route OAuth accounts trying to use standard password access strategy
    if (user.isGoogleUser && !user.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account was created using Google Sign-In. Please click 'Continue with Google'.",
      });
    }

    // Evaluate credential authenticity
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // Issue cryptographic authorization token
    const token = generateToken(user._id);

    // Return authorization context and clean client-side safe user profiles
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        savedAddress: user.savedAddress || {}, // Included for frontend dashboard initialization
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// FEDERATED OAUTH GOOGLE LOGIN CONTROLLER
// ==========================================
export const googleLogin = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Google profile email is missing." });
    }

    // Locate matching database identity or register federated profile context
    let user = await User.findOne({ email });

    if (!user) {
      // Provision account dynamically for newly verified Google OAuth sessions
      user = await User.create({
        name,
        email,
        isGoogleUser: true,
        role: "user",
      });
    }

    // Issue security access token for the synchronized session
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        savedAddress: user.savedAddress || {}, // Included for consistency across session types
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET USER PROFILE
// ==========================================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User account not found." });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      gender: user.gender || "Male",
      savedAddress: user.savedAddress || {}, // Dispatched to ensure default address loads on client init
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// UPDATE USER PROFILE
// ==========================================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, phone, gender } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User account not found." });
    }

    // Input payload map updates
    user.name = name || user.name;
    user.phone = phone !== undefined ? phone : user.phone;
    user.gender = gender || user.gender;

    const updatedUser = await user.save();

    return res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      gender: updatedUser.gender,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// UPDATE USER DEFAULT ADDRESS
// ==========================================
export const updateUserAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, phone, address, city, pincode } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User account not found." });
    }

    // Populate and update structural address fields
    user.savedAddress = {
      name: name !== undefined ? name : user.savedAddress.name,
      phone: phone !== undefined ? phone : user.savedAddress.phone,
      address: address !== undefined ? address : user.savedAddress.address,
      city: city !== undefined ? city : user.savedAddress.city,
      pincode: pincode !== undefined ? pincode : user.savedAddress.pincode,
    };

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Shipping address updated successfully.",
      savedAddress: updatedUser.savedAddress,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

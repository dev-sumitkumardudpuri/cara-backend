import Order from "../models/Order.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";

// @desc    Get all dashboard statistics (Orders, Users, Messages, Sales)
// @route   GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const totalOrders = (await Order.countDocuments()) || 0;
    const totalUsers =
      (await User.countDocuments({ role: { $in: ["User", "user"] } })) || 0;
    const totalMessages =
      (await Contact.countDocuments({ status: "unread" })) || 0;

    // Calculate total sales by excluding refunded and cancelled orders (only processing 'Delivered' status)
    const validOrders = (await Order.find({ status: "Delivered" })) || [];
    const totalSales = validOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    );

    const recentOrders =
      (await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")) || [];

    const recentMessages =
      (await Contact.find().sort({ createdAt: -1 }).limit(5)) || [];

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalUsers,
        totalMessages,
        totalSales,
      },
      recentOrders,
      recentMessages,
    });
  } catch (error) {
    console.error("ADMIN_STATS_FETCH_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching dashboard statistics.",
      error: error.message,
    });
  }
};

// @desc    Get all orders for the admin management panel
// @route   GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders sorted by newest first, including associated user details
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("ADMIN_ORDERS_FETCH_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving management orders.",
    });
  }
};

// @desc    Get all contact/support messages
// @route   GET /api/admin/messages
export const getAllMessages = async (req, res) => {
  try {
    const messages = (await Contact.find().sort({ createdAt: -1 })) || [];
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("ADMIN_MESSAGES_FETCH_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving customer messages.",
    });
  }
};

// @desc    Toggle contact message status (Read / Unread)
// @route   PATCH /api/admin/messages/:id/status
export const toggleMessageStatus = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "The requested message could not be found.",
      });
    }

    message.status = message.status === "unread" ? "read" : "unread";
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message status successfully updated to ${message.status}.`,
      updatedMessage: message,
    });
  } catch (error) {
    console.error("ADMIN_MESSAGE_TOGGLE_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the message status.",
    });
  }
};

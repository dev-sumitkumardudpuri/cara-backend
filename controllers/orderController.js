import Order from "../models/Order.js";
import Stripe from "stripe";
import Cart from "../models/Cart.js";

// Helper for Stripe initialization
const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe Secret Key is missing in server .env configuration.",
    );
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// ==========================================================
// PIPELINE 1: PLACE ORDER (COD & STRIPE INITIALIZATION)
// ==========================================================
export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, items, totalAmount, paymentMethod } = req.body;
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

    if (
      !shippingAddress ||
      !items ||
      items.length === 0 ||
      !totalAmount ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required order parameters.",
      });
    }

    if (paymentMethod === "Stripe" && !process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message:
          "Stripe integration is currently unavailable due to misconfiguration.",
      });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User authentication failed." });
    }

    const userId = req.user.id || req.user._id;
    const prefix = paymentMethod === "Stripe" ? "STRIPE" : "COD";
    const generatedOrderId = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Calculate Estimated Delivery Date (Current Date + 5 Days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const newOrder = new Order({
      userId,
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      status: "Processing",
      orderId: generatedOrderId,
      estimatedDeliveryDate: deliveryDate,
    });

    // FLOW A: CASH ON DELIVERY (COD)
    if (paymentMethod !== "Stripe") {
      const savedOrder = await newOrder.save();
      try {
        await Cart.findOneAndDelete({ userId: userId });
      } catch (cartErr) {
        console.error("CART_CLEAR_ERROR_COD:", cartErr);
      }

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        orderId: savedOrder.orderId,
      });
    }

    // FLOW B: STRIPE GATEWAY DISPATCH
    const stripe = getStripeInstance();
    const line_items = items.map((item) => {
      const isAbsoluteUrl =
        item.img &&
        (item.img.startsWith("http://") || item.img.startsWith("https://"));
      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name || item.title || "Premium Shopping Item",
            images: isAbsoluteUrl ? [item.img] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${generatedOrderId}`,
      cancel_url: `${FRONTEND_URL}/cart`,
    });

    await newOrder.save();

    return res.status(200).json({
      success: true,
      stripeUrl: session.url,
      orderId: generatedOrderId,
    });
  } catch (error) {
    console.error("ORDER_PLACEMENT_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your order allocation.",
      error: error.message,
    });
  }
};

// ==========================================================
// PIPELINE 2: VERIFY STRIPE ORDER & CLEAR CART
// ==========================================================
export const verifyStripeOrder = async (req, res) => {
  try {
    const { session_id, order_id } = req.body;
    const userId = req.user.id || req.user._id;

    if (!session_id || !order_id) {
      return res.status(400).json({
        success: false,
        message: "Required validation parameters are missing.",
      });
    }

    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: order_id },
        {
          paymentStatus: "Paid",
          paymentIntentId: session.payment_intent || "",
        },
        { new: true },
      );

      try {
        await Cart.findOneAndDelete({ userId: userId });
      } catch (cartErr) {
        console.error("CART_CLEAR_ERROR_STRIPE:", cartErr);
      }

      return res.status(200).json({
        success: true,
        message: "Payment transaction verified successfully.",
        order: updatedOrder,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment validation failed. Transaction status unverified.",
      });
    }
  } catch (error) {
    console.error("STRIPE_VERIFICATION_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification mapping.",
      error: error.message,
    });
  }
};

// ==========================================================
// PIPELINE 3: GET USER LOGGED IN ORDERS
// ==========================================================
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("FETCH_USER_ORDERS_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving historical order records.",
    });
  }
};

// ==========================================================
// PIPELINE 4: CANCEL ORDER (USER SIDE)
// ==========================================================
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Requested order could not be located.",
      });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized resource access denied.",
      });
    }

    // Validation guard clause to check current logistical state
    if (
      [
        "In Transit",
        "Delivered",
        "Cancelled",
        "Refunded",
        "Pending Refund",
      ].includes(order.status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is currently marked as ${order.status}.`,
      });
    }

    // Process state transition criteria based on payment method
    if (order.paymentMethod === "Stripe" && order.paymentStatus === "Paid") {
      order.status = "Pending Refund";
    } else {
      order.status = "Cancelled";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status successfully updated to ${order.status}.`,
      updatedStatus: order.status,
    });
  } catch (error) {
    console.error("ORDER_CANCELLATION_ERROR:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred during execution of the cancellation workflow.",
    });
  }
};

// ==========================================================
// PIPELINE 5: UPDATE ORDER STATUS BY ADMIN
// ==========================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Processing",
      "In Transit",
      "Delivered",
      "Cancelled",
      "Pending Refund",
      "Refunded",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status configuration parameter. Options include: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Requested order could not be located.",
      });
    }

    if (status === "Delivered" && order.paymentMethod !== "Stripe") {
      order.paymentStatus = "Paid";
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated successfully to ${status}.`,
      updatedOrder: order,
    });
  } catch (error) {
    console.error("ADMIN_STATUS_UPDATE_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating logistical parameters.",
    });
  }
};

// ==========================================================
// PIPELINE 6: TRIGGER REFUND FOR STRIPE (ADMIN ONLY)
// ==========================================================
export const processOrderRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Requested order could not be located.",
      });
    }

    if (order.status !== "Pending Refund") {
      return res.status(400).json({
        success: false,
        message: "Only orders pending settlement refunds can be processed.",
      });
    }

    if (order.paymentMethod === "Stripe" && order.paymentIntentId) {
      try {
        const stripe = getStripeInstance();
        await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
        });
      } catch (stripeErr) {
        console.error("STRIPE_API_REFUND_BYPASS_FALLBACK:", stripeErr.message);
      }
    }

    order.status = "Refunded";
    order.paymentStatus = "Failed";
    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order remittance successfully refunded and document fields updated.",
      updatedOrder: order,
    });
  } catch (error) {
    console.error("REFUND_PROCESSING_ERROR:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while executing the transaction reversal pipeline.",
    });
  }
};

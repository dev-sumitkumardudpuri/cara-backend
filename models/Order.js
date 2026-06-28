import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        img: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Stripe"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: [
        "Processing",
        "In Transit",
        "Delivered",
        "Cancelled",
        "Pending Refund",
        "Refunded",
      ],
      default: "Processing",
    },
    paymentIntentId: {
      type: String,
      default: "",
    },
    // Logistical allocation parameter to map dynamic shipping metrics
    estimatedDeliveryDate: {
      type: Date,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;

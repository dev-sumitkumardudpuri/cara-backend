import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    // Reference mapping to associate the cart document with a specific user instance
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Collection of product items appended to the user session cart instance
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        img: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Cart", cartSchema);

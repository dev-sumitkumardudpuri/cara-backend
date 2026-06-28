import Cart from "../models/Cart.js";

// ==========================================
// ADD TO CART / UPDATE QUANTITY
// ==========================================
export const addToCart = async (req, res) => {
  try {
    const { productId, name, price, img, quantity } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          { productId: String(productId).trim(), name, price, img, quantity },
        ],
      });
    } else {
      // Enforce clean string castings to match existing documents securely
      const itemIndex = cart.items.findIndex(
        (item) => String(item.productId).trim() === String(productId).trim(),
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({
          productId: String(productId).trim(),
          name,
          price,
          img,
          quantity,
        });
      }
    }

    await cart.save();
    return res
      .status(200)
      .json({ success: true, message: "Cart updated successfully.", cart });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the cart.",
      error: error.message,
    });
  }
};

// ==========================================
// GET USER CART DATA
// ==========================================
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ success: true, items: [] });
    }

    return res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the cart items.",
      error: error.message,
    });
  }
};

// ==========================================
// REMOVE ITEM FROM CART
// ==========================================
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Clean target mapping evaluations to ensure type-safe filter conditions
      cart.items = cart.items.filter(
        (item) => String(item.productId).trim() !== String(productId).trim(),
      );
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Item successfully removed from cart.",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while removing the item from the cart.",
      error: error.message,
    });
  }
};

// ==========================================
// CLEAR ENTIRE CART
// ==========================================
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.findOneAndDelete({ userId });

    return res.status(200).json({
      success: true,
      message: "Cart successfully cleared.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while clearing the cart.",
      error: error.message,
    });
  }
};

// ==========================================
// MERGE LOCAL STORAGE CART WITH DATABASE
// ==========================================
export const mergeCart = async (req, res) => {
  try {
    let { localCartItems } = req.body;
    const userId = req.user.id;

    if (!localCartItems || localCartItems.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No items to merge." });
    }

    // Deduplicate incoming client payloads prior to array synchronization procedures
    const uniqueLocalItems = [];
    localCartItems.forEach((item) => {
      const itemId = String(item.id || item.productId).trim();
      const existingInUnique = uniqueLocalItems.find(
        (uItem) => String(uItem.id || uItem.productId).trim() === itemId,
      );

      if (existingInUnique) {
        existingInUnique.quantity += Number(item.quantity) || 1;
      } else {
        uniqueLocalItems.push({ ...item });
      }
    });

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      const formattedItems = uniqueLocalItems.map((item) => ({
        productId: String(item.id || item.productId).trim(),
        name: item.name,
        price: item.price,
        img: item.img,
        quantity: Number(item.quantity) || 1,
      }));

      cart = new Cart({
        userId,
        items: formattedItems,
      });
    } else {
      uniqueLocalItems.forEach((localItem) => {
        const targetLocalId = String(
          localItem.id || localItem.productId,
        ).trim();

        const itemIndex = cart.items.findIndex((dbItem) => {
          const dbId = dbItem.productId ? String(dbItem.productId).trim() : "";
          return dbId === targetLocalId;
        });

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += Number(localItem.quantity) || 1;
        } else {
          cart.items.push({
            productId: targetLocalId,
            name: localItem.name,
            price: localItem.price,
            img: localItem.img,
            quantity: Number(localItem.quantity) || 1,
          });
        }
      });
    }

    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Cart merged successfully.",
      items: cart.items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while merging the cart.",
      error: error.message,
    });
  }
};

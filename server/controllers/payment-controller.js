const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const User = require("../models/user-model");
const Payment = require("../models/payment-model");

const createOrder = async (req, res) => {
  try {
    // ✅ Always calculate price on backend
    const PRO_PRICE_INR = 99; // example: ₹499/month
    const amountInPaise = PRO_PRICE_INR * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // public key is OK to send
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order. Please try again.",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data missing",
      });
    }

    // 1️⃣ Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // 2️⃣ Fetch user
    const userId = req.userID;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3️⃣ Save payment record (IMPORTANT)
    await Payment.create({
      userId: user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: 99,
      currency: "INR",
      status: "success",
    });

    // 4️⃣ Calculate expiry (renewal-safe)
    const now = new Date();

    const baseDate =
      user.plan === "pro" && user.planExpiresAt && user.planExpiresAt > now
        ? user.planExpiresAt
        : now;

    const expiresAt = new Date(baseDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // 5️⃣ Upgrade user
    await User.findByIdAndUpdate(userId, {
      plan: "pro",
      planExpiresAt: expiresAt,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified. Pro activated.",
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};

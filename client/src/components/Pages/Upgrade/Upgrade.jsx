import React from "react";
import styles from "./Upgrade.module.css";
import { useAuth } from "../../../store/Auth";
import toast from "react-hot-toast";

export const Upgrade = () => {
  const { authorizationToken } = useAuth(); // Bearer token

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    // 1. Load Razorpay SDK
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Razorpay SDK failed to load. Check your internet.");
      return;
    }

    try {
      // 2. Create order from backend
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        toast.error("Unable to create order");
        return;
      }

      // 3. Razorpay options
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Trading Journal Pro",
        description: "Pro Subscription",
        handler: async function (response) {

          try {
            const verifyRes = await fetch(`${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authorizationToken,
              },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success("Payment verified! Pro activated.");
              window.location.href = "/app/dashboard";
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (err) {
             toast.error("Verification error. Contact support.");
          }
        },
        theme: {
          color: "#6e7cff",
        },
      };

      // 4. Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={`${styles.upgradePage} app-page`}>
      {/* Page Header */}
      <header className={`${styles.header} app-page-heading`}>
        <h1 className="app-page-title">Upgrade <span>to Pro</span></h1>
        <p className="app-page-subtitle">
          Unlock advanced journaling tools and performance insights to trade
          with clarity.
        </p>
      </header>

      {/* Why Pro Section */}
      <section className={styles.whyPro}>
        <h2>Why Upgrade to Pro</h2>
        <ul>
          <li>Identify exactly what's working and what's not</li>
          <li>Remove weak trades and improve consistency</li>
          <li>Trade with data instead of guesswork</li>
        </ul>
      </section>

      {/* Pro Plan Card */}
      <section className={styles.planCard}>
        <h2>Pro Plan</h2>
        <p className={styles.contextLine}>Everything you need to improve your trading performance</p>

        <div className={styles.recommendedLabel}>
          Recommended for serious traders
        </div>

        <ul className={styles.features}>
          <li>Track more trades without restrictions</li>
          <li>Find exactly what's working and what's not</li>
          <li>Manage multiple trading accounts in one place</li>
          <li>Upload up to 3 screenshots per trade</li>
          <li className={styles.highlighted}>See your strongest edge and weakest patterns</li>
        </ul>

        {/* Pricing Divider */}
        <div className={styles.pricingDivider}></div>

        {/* Pricing */}
        <div className={styles.pricing}>
          <span className={styles.price}>₹99</span>
          <span className={styles.billing}>/ month</span>
        </div>

        {/* CTA */}
        <button className={styles.primaryBtn} onClick={handlePayment}>
          Upgrade to Pro
        </button>

        {/* Trust */}
        <p className={styles.note}>Secure payments · No hidden charges</p>
      </section>
    </div>
  );
};

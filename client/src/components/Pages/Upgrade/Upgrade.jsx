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
        `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
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
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
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
          color: "#f6b93b",
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
    <div className={styles.upgradePage}>
      {/* Page Header */}
      <header className={styles.header}>
        <h1>Upgrade to Pro</h1>
        <p>
          Unlock advanced journaling tools and performance insights to trade
          with clarity.
        </p>
      </header>

      {/* Why Pro Section */}
      <section className={styles.whyPro}>
        <h2>Why upgrade to Pro?</h2>
        <ul>
          <li>
            Get a clearer view of your trading performance with structured
            analytics
          </li>
          <li>Remove journaling limits as your trading volume grows</li>
          <li>Build consistency with better insights, not guesswork</li>
        </ul>
      </section>

      {/* Pro Plan Card */}
      <section className={styles.planCard}>
        <h2>Pro Plan</h2>

        <ul className={styles.features}>
          <li>Higher trade limits</li>
          <li>Advanced filters (PnL, account, tags)</li>
          <li>Up to 5 trading accounts</li>
          <li>Up to 3 screenshots per trade</li>
          <li>Performance analytics</li>
        </ul>

        {/* Pricing */}
        <div className={styles.pricing}>
          <span className={styles.price}>₹99</span>
          <span className={styles.billing}>/ month</span>
        </div>

        {/* CTA */}
        <button className={styles.primaryBtn} onClick={handlePayment}>
          Proceed to Payment
        </button>

        {/* Trust */}
        <p className={styles.note}>Secure payments · No hidden charges</p>
      </section>
    </div>
  );
};

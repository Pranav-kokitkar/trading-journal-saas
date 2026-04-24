import React, { useContext, useState } from "react";
import styles from "./Auth.module.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import toast from "react-hot-toast";
import { TradeContext } from "../../../store/TradeContext";
import { AccountContext } from "../../../context/AccountContext";
import { SkeletonInput } from "../../ui/skeleton/Skeleton";
import { API_BASE_URL } from "../../../config/api";

export const Login = () => {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { storeTokenInLS } = useAuth();
  const { isLoggedIn } = useAuth();
  const { refreshTrades } = useContext(TradeContext);
  const { getAllAccounts } = useContext(AccountContext);

  const navigate = useNavigate();

  const handleChange = (e) => {
    let name = e.target.name;
    let value = e.target.value;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        }
      );
      const res_data = await response.json();
      if (response.ok) {
        storeTokenInLS(res_data.token);
        refreshTrades();
        getAllAccounts();
        navigate("/app/dashboard");
        toast.success("Login successful");
        setUser({
          name: "",
          email: "",
          password: "",
        });
      } else {
        toast.error(
          res_data.extraDetails ? res_data.extraDetails : res_data.message
        );
      }
    } catch (error) {
      console.log("error while login", error);
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.brandLink} aria-label="Kyros Journal home">
        <img src="/favicon2.ico" alt="Kyros Journal" className={styles.brandLogo} />
      </Link>

      {/* Back Button */}
      <Link to="/" className={styles.backButton}>
        Back to Home
      </Link>

      {/* Card Wrapper */}
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.content}>
            <div className={styles.eyebrow}>
              Welcome back — let’s refine your edge.
            </div>
            <div className={styles.title}>
              <div className={styles.logo}>KJ</div>
              <div>
                <h2 className={styles.h2}>Welcome Back</h2>
                <div className={styles.subtitle}>
                  Continue refining your strategy with data-driven insights.
                </div>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  value={user.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button 
                className={styles.btn} 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <SkeletonInput className={styles.buttonSkeleton} height={14} /> : "Continue to Your Journal"}
              </button>

              <div className={styles.trustLine}>
                Your data. Your edge.
              </div>

              <div className={styles.row}>
                <div className={styles.small}>Don't have an account?</div>
                <Link className={styles.link} to="/register">
                  Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

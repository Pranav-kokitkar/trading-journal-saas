import React, { useContext, useRef, useState } from "react";
import styles from "./Auth.module.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import { toast } from "react-toastify";
import { TradeContext } from "../../../store/TradeContext";
import { AccountContext } from "../../../context/AccountContext";

export const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const confirmPasswordRef = useRef();
  const { storeTokenInLS } = useAuth();
  const { isLoggedIn } = useAuth();

  const { refreshTrades } = useContext(TradeContext);
  const { getAllAccounts } = useContext(AccountContext);

  const handleChange = async (e) => {
    let name = e.target.name;
    let value = e.target.value;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const confirmPass = confirmPasswordRef.current.value;

    if (user.password !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
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
        toast.success("Registration successful");
        setUser({
          name: "",
          email: "",
          password: "",
        });
        navigate("/app/dashboard");
      } else {
        toast.error(
          res_data.extraDetails ? res_data.extraDetails : res_data.message
        );
      }
    } catch (error) {
      console.log("error while register", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <Link to="/" className={styles.backButton}>
        Back to Home
      </Link>

      {/* Card Wrapper */}
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.content}>
            <div className={styles.title}>
              <div className={styles.logo}>TJ</div>
              <div>
                <h2 className={styles.h2}>Create Account</h2>
                <div className={styles.subtitle}>
                  Start logging trades and tracking performance
                </div>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Enter your name"
                  name="name"
                  id="name"
                  value={user.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  id="email"
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
                  id="password"
                  value={user.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Confirm your password"
                  ref={confirmPasswordRef}
                  required
                />
              </div>

              <button className={styles.btn} type="submit">
                Create Account
              </button>

              <div className={styles.row}>
                <div className={styles.small}>Already have an account?</div>
                <Link className={styles.link} to="/login">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

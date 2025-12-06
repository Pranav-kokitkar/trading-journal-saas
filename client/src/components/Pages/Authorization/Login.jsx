// src/pages/Login.jsx
import React, { useContext, useState } from "react";
import styles from "./Auth.module.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import { toast } from "react-toastify";
import { PerformanceContext } from "../../../context/PerformanceContext";

export const Login = () => {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const { storeTokenInLS } = useAuth();
  const {isLoggedIn} = useAuth();

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
    try {
      const response = await fetch(`http://localhost:3000/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const res_data = await response.json();
      if (response.ok) {
        storeTokenInLS(res_data.token);
        navigate("/app/dashboard");
        toast.success("login successful", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
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
    }
  };

  if(isLoggedIn){
    return <Navigate to="/app/dashboard" replace/>
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.title}>
            <div className={styles.logo}>TJ</div>
            <div>
              <h2 className={styles.h2}>Login</h2>
              <div className={styles.subtitle}>Access your trading journal</div>
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
              />
            </div>

            <button className={styles.btn} type="submit">
              Login
            </button>

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
  );
};

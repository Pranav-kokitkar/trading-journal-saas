// src/pages/Register.jsx
import React, { useRef, useState } from "react";
import styles from "./Auth.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";

export const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const confirmPasswordRef = useRef();
  const {storeTokenInLS} = useAuth();

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

    if(user.password!==confirmPass){
        alert("password does not match");
        return
    }
    try {
      const response = await fetch(`http://localhost:3000/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (response.ok) {
        const res_data = await response.json();
        storeTokenInLS(res_data.token);
        console.log("register sucess");
        setUser({
          name: "",
          email: "",
          password: "",
        });
        navigate("/");
      } else {
        console.log("failed to regsiter");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
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
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Confirm your password"
                ref={confirmPasswordRef}
              />
            </div>

            <button className={styles.btn} type="submit">
              Register
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
  );
};

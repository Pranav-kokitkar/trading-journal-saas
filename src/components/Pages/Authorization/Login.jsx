// src/pages/Login.jsx
import React from "react";
import styles from "./Auth.module.css";
import { Link } from "react-router-dom";

export const Login=()=> {
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

          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="Enter your email"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Enter your password"
              />
            </div>

            <button className={styles.btn} type="button">
              Login
            </button>

            <div className={styles.row}>
              <div className={styles.small}>Don't have an account?</div>
              <Link className={styles.link} to="/register">Register</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

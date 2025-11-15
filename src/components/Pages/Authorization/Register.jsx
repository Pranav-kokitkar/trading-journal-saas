// src/pages/Register.jsx
import React from "react";
import styles from "./Auth.module.css";
import { Link } from "react-router-dom";

export const Register=()=> {
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

          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter your name"
              />
            </div>

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

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Confirm your password"
              />
            </div>

            <button className={styles.btn} type="button">
              Register
            </button>

            <div className={styles.row}>
              <div className={styles.small}>Already have an account?</div>
              <Link
                className={styles.link}
                to="/login"
              >Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

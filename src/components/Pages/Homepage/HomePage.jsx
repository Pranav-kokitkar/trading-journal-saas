import React from "react";
import styles from "./Homepage.module.css";
import { Link } from "react-router-dom";
import { Navbar } from "../../Layout/Navbar";
import { Footer } from "../../Layout/Footer";

export const HomePage =()=> {
  return (
    <div className={styles.container}>
      <Navbar/>

      <main className={styles.hero}>
        <h1 className={styles.title}>
          Your <span>Trading Journal</span>, Reinvented.
        </h1>

        <p className={styles.subtitle}>
          Track your trades, analyze performance, improve consistency. A clean
          and powerful journal built for serious traders like you.
        </p>

        <div className={styles.cta}>
          <Link to="/register" className={styles.primaryBtn}>
            Create Account
          </Link>
          <Link to="/login" className={styles.secondaryBtn}>
            Login
          </Link>
        </div>
      </main>

      <Footer/>
    </div>
  );
}

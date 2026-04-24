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
          We don’t just track trades. We <span>eliminate your worst ones.</span>
        </h1>

        <p className={styles.mutedLine}>
          Your edge isn’t adding more trades — it’s removing bad ones.
        </p>

        <div className={styles.cta}>
          <Link to="/register" className={styles.primaryBtn}>
            Start Building Your Edge
          </Link>
          <Link to="/login" className={styles.secondaryBtn}>
            Login
          </Link>
        </div>
      </main>

      <section className={styles.contentSection}>
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            Cut the trades that cost you. Keep the ones that pay.
          </h2>
          <p className={styles.sectionText}>
            Most traders try to improve by doing more.
            <br />
            Professionals improve by eliminating what doesn’t work.
          </p>
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionWide}`}>
          <h2 className={styles.sectionTitle}>
            Know exactly where you’re weak.
          </h2>
          <ul className={styles.featureList}>
            <li>We show you exactly when, where, and why you lose</li>
            <li>Break down performance by pair, session, and trade type</li>
            <li>Turn patterns into clear decisions</li>
          </ul>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            Your data reveals what you’re doing wrong.
          </h2>
          <p className={styles.sectionText}>
            Losing on GBP/USD during London session shorts?
            <br />
            <br />
            We surface patterns like this automatically — so you can eliminate them and increase your win rate.
          </p>

          <div className={styles.dataBlock}>
            <p className={styles.dataBlockPair}>GBP/USD — London Session — Short</p>
            <p className={styles.dataBlockMetric}>
              <span className={styles.dataMetricValue}>28%</span> Win Rate
            </p>
            <p className={styles.dataBlockMetric}>
              <span className={`${styles.dataMetricValue} ${styles.dataMetricLoss}`}>-$420</span> PnL
            </p>
            <p className={styles.dataBlockInsight}>
              → This setup is consistently <span className={styles.insightEmphasis}>losing</span>
            </p>
          </div>

          <p className={styles.supportingLine}>
            Every trade you eliminate improves your system.
          </p>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>
            This isn’t just a journal.
          </h2>
          <p className={styles.sectionText}>
            It’s a decision-filtering system designed to remove weak trades and refine your strategy over time.
          </p>
        </div>

        <div className={styles.finalCtaSection}>
          <p className={styles.finalCtaText}>
            Stop tracking trades. <span>Start eliminating mistakes.</span>
          </p>
          <Link to="/register" className={styles.primaryBtn}>
            Refine Your Strategy
          </Link>
        </div>
      </section>

      <Footer/>
    </div>
  );
}

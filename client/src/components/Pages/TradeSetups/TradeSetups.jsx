import React, { useState } from "react";
import { Tags } from "../TradeSetups/Tags/Tags";
import { Strategy } from "./Strategy/Strategy";
import styles from "./TradeSetups.module.css";

export const TradeSetups = () => {
  const [activeTab, setActiveTab] = useState("tags");

  return (
    <section className={styles.tradeSetupsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Trade <span>Setups</span>{" "}
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab("tags")}
          className={`${styles.tabButton} ${
            activeTab === "tags" ? styles.active : ""
          }`}
        >
          Tags Management
        </button>

        <button
          onClick={() => setActiveTab("strategies")}
          className={`${styles.tabButton} ${
            activeTab === "strategies" ? styles.active : ""
          }`}
        >
          Strategy Management
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeTab === "tags" && <Tags />}
        {activeTab === "strategies" && <Strategy />}
      </div>
    </section>
  );
};

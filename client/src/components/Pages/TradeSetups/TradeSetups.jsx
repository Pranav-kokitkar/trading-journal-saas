import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tags } from "../TradeSetups/Tags/Tags";
import { Strategy } from "./Strategy/Strategy";
import styles from "./TradeSetups.module.css";

export const TradeSetups = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeTab = location.pathname.endsWith("/strategies")
    ? "strategies"
    : location.pathname.endsWith("/tags")
      ? "tags"
      : null;
  const [legacyTab, setLegacyTab] = useState("tags");
  const activeTab = routeTab || legacyTab;
  const selectTab = (tab) => {
    if (routeTab) {
      navigate(`/app/${tab}`);
    } else {
      setLegacyTab(tab);
    }
  };

  return (
    <section className={`${styles.tradeSetupsPage} app-page`}>
      {/* Page Header */}
      <div className={`${styles.pageHeader} app-page-heading`}>
        <h1 className="app-page-title">
          Trade <span>Setups</span>{" "}
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          onClick={() => selectTab("tags")}
          className={`${styles.tabButton} ${
            activeTab === "tags" ? styles.active : ""
          }`}
        >
          Tags Management
        </button>

        <button
          onClick={() => selectTab("strategies")}
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

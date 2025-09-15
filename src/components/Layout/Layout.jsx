import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import styles from "./Layout.module.css";

export const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.show : ""}`}>
        <Sidebar />
      </aside>

      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button className={styles.hamburger} onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h3>TradingJournal</h3>
      </header>

      {/* Main content */}
      <main className={styles.outlet}>
        <Outlet />
      </main>
    </div>
  );
};

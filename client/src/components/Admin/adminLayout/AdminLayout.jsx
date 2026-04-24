import { Outlet } from "react-router-dom";
import styles from "../../Layout/Layout.module.css";
import { AdminSidebar } from "../adminSidebar/AdminSidebar";
import { useEffect, useState } from "react";

export const AdminLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 768px)").matches) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle admin menu"
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h3>TradingJournal</h3>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.show : ""}`}>
        <AdminSidebar onClose={closeSidebar} />
      </aside>

      {/* Overlay - only renders when sidebar is open */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

      {/* Main content */}
      <main className={styles.outlet}>
        <Outlet />
      </main>
    </div>
  );
};

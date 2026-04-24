import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./SideBar";
import styles from "./Layout.module.css";
import { UpgradeProModal } from "../modals/UpgradeProModal/UpgradeProModal";
import { useAuth } from "../../store/Auth";
import { CreateAccModal } from "../modals/CreateAccModal/CreateAccModal";

export const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [IsCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { isPro, isAuthLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCloseUpgrade = () => {
    localStorage.setItem("hasSeenUpgradeModal", "true");
    setIsUpgradeOpen(false);
  };

  const closeSidebar = () => setIsOpen(false);

  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

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

  useEffect(() => {
    if (isAuthLoading) return;
    if (user && user.activeAccountId == null) {
      setIsCreateModalOpen(true);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (IsCreateModalOpen) return;
    if (isPro) return;

    const hasSeenUpgradeModal = localStorage.getItem("hasSeenUpgradeModal");
    if (hasSeenUpgradeModal) return;

    const timer = setTimeout(() => {
      setIsUpgradeOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [IsCreateModalOpen, isAuthLoading, isPro]);

  return (
    <div className={styles.layout}>
      {/* Mobile Header - Always render, CSS controls visibility */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h3 className={styles.title}>
          Kyros <span>Journal</span>
        </h3>
      </header>

      {/* Sidebar - class changes based on isOpen state */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.show : ""}`}>
        <Sidebar onClose={closeSidebar} />
      </aside>

      {/* Overlay - only renders when sidebar is open */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

      {/* Main content */}
      <main className={styles.outlet}>
        <Outlet />
      </main>

      {/* Modals */}
      {IsCreateModalOpen && (
        <CreateAccModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      {isUpgradeOpen && <UpgradeProModal onClose={handleCloseUpgrade} />}
      <button
        className={styles.addTradeBtn}
        onClick={() => navigate("/app/add-trade")}
        aria-label="Add Trade"
        title="Add New Trade"
      >
        <span className={styles.plusIcon}>+</span>
      </button>
    </div>
  );
};

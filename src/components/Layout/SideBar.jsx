import styles from "./SideBar.module.css";

export const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
        </div>
        <div className={styles.logoText}>
          <h3>TradingJournal</h3>
          <p>Professional Trading Analytics</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li className={styles.active}>
            <span>Dashboard</span>
          </li>
          <li>
            <span>Add Trade</span>
          </li>
          <li>
            <span>Trade History</span>
          </li>
          <li>
            <span>My Account</span>
          </li>
        </ul>
      </nav>

      {/* Bottom User Info */}
      <div className={styles.user}>
        <div className={styles.avatar}>T</div>
        <div>
          <p className={styles.username}>Trader</p>
          <span className={styles.subText}>Demo Account</span>
        </div>
      </div>
    </div>
  );
};
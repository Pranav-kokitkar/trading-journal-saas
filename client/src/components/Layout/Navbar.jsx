import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

export const Navbar = () => {
  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand} aria-label="Log My Trade home">
        <div className={styles.logoBox}>TJ</div>
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>Log My Trade</span>
          <span className={styles.brandSubtitle}>Trading journal</span>
        </div>
      </Link>

      <nav className={styles.links}>
        <Link to="/register" className={styles.navBtn}>
          Get Started
        </Link>
      </nav>
    </header>
  );
};

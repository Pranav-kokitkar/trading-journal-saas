import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

export const Navbar = () => {
  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand} aria-label="Kyros Journal home">
        <img
          src="/favicon2.ico"
          alt="Kyros Journal"
          className={styles.logoImage}
        />
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>Kyros Journal</span>
        </div>
      </Link>

      <nav className={styles.links}>
        <Link to="/register" className={styles.navBtn}>
          Start Free
        </Link>
      </nav>
    </header>
  );
};

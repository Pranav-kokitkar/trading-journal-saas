import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

export const Navbar = () => {
  return (
    <header className={styles.nav}>
            <div className={styles.logoBox}>
              <div className={styles.logoBox}>TJ</div>
            </div>
    
            <nav className={styles.links}>
              <Link to="/register" className={styles.navBtn}>
                Get Started
              </Link>
            </nav>
          </header>
  );
};

import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} Kyros Journal. All rights reserved.</span>
      <Link to="/features">Features</Link>
    </footer>
  );
};

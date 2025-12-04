import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      © {new Date().getFullYear()} Trading Journal. All rights reserved.
    </footer>
  );
};

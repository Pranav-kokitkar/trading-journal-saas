import styles from "./SideBar.module.css";
import {NavLink} from "react-router-dom"

export const Sidebar = () => {

  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navlink} ${styles.active}` : `${styles.navlink}`; 
  };

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoText}>
          <h3>Log My Trade</h3>
          <p>Professional Trading journal software</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li className={styles.active}>
            <NavLink className={getNavLinkClass} to="/">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/add-trade">
              Add Trade
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/trade-history">
              Trade History
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/add-notes">
              Add Notes
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/my-account">
              My Account
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom User Info */}
      <div className={styles.user}>
        <div className={styles.avatar}>U</div>
        <div>
          <p className={styles.username}>User</p>
          <span className={styles.subText}>Demo Account</span>
        </div>
      </div>
    </div>
  );
};
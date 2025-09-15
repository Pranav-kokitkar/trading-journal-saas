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
        <div className={styles.logoIcon}></div>
        <div className={styles.logoText}>
          <h3>TradingJournal</h3>
          <p>Professional Trading Analytics</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li className={styles.active}>
            <NavLink className={getNavLinkClass} to="/trade">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/addtrade">
              Add Trade
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/tradehistory">
              Trade History
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/addnotes">
              Add Notes
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/myaccount">
              My Account
            </NavLink>
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
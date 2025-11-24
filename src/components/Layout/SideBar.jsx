import styles from "./SideBar.module.css";
import {NavLink, Link} from "react-router-dom";
import { useAuth } from "../../store/Auth";

export const Sidebar = () => {

  const {user} = useAuth();

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
          <li >
            <NavLink className={getNavLinkClass} to="/app/dashboard">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/add-trade">
              Add Trade
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/trade-history">
              Trade History
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/add-notes">
              Add Notes
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/contact">
            Contact
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom User Info */}
        <Link to="/app/my-account">
      <div className={styles.user}>
        <div className={styles.avatar}>U</div>
        <div>
          <p className={styles.username}>{!user ? "user" : `${user.name}`}</p>
          <span className={styles.subText}>Your Account</span>
        </div>
      </div>
      </Link>
    </div>
  );
};
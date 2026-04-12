import styles from "./SideBar.module.css";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../store/Auth";

export const Sidebar = ({ onClose }) => {

  const { user, isAdmin, isPro, isAuthLoading } = useAuth();

  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navlink} ${styles.active}` : `${styles.navlink}`; 
  };

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoText}>
          <h3 className={styles.title}>
            Log My <span>Trade</span>
          </h3>
          <p>Professional Trading journal </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li>
            <NavLink className={getNavLinkClass} to="/app/dashboard" onClick={onClose}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/trade-history" onClick={onClose}>
              Trade History
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/add-notes" onClick={onClose}>
              Notes
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/contact" onClick={onClose}>
              Contact
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/trade-setups" onClick={onClose}>
              Trade Setups
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/upgrade" onClick={onClose}>
              Upgrade
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/compare" onClick={onClose}>
              Compare
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/analytics" onClick={onClose}>
              Analytics
            </NavLink>
          </li>
          <li>
            {isAdmin && (
              <NavLink className={getNavLinkClass} to="/admin" onClick={onClose}>
                Admin
              </NavLink>
            )}
          </li>
        </ul>
      </nav>

      {/* Bottom User Info */}
      <Link to="/app/my-account" className={styles.user}>
        <div className={styles.avatar}>U</div>
        <div className={styles.userMeta}>
          <p className={styles.username}>{!user ? "user" : `${user.name}`}</p>
          <span className={styles.subText}>Your Account</span>
        </div>
        {!isAuthLoading && isPro && <p className={styles.proBadge}>PRO</p>}
      </Link>
    </div>
  );
};
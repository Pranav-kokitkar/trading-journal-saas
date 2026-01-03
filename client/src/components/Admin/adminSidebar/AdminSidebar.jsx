import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import styles from "../../Layout/SideBar.module.css";

export const AdminSidebar = ({ onClose }) => {
  const { user } = useAuth();

  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? `${styles.navlink} ${styles.active}`
      : `${styles.navlink}`;
  };

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoText}>
          <h3 className={styles.title}>
            Log My <span>Trade</span>
          </h3>
          <p>Admin Panel </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li>
            <NavLink
              className={getNavLinkClass}
              to="/admin/dashboard"
              onClick={onClose}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              className={getNavLinkClass}
              to="/admin/users"
              onClick={onClose}
            >
              Users
            </NavLink>
          </li>
          <li>
            <NavLink
              className={getNavLinkClass}
              to="/admin/accounts"
              onClick={onClose}
            >
              Accounts
            </NavLink>
          </li>
          <li>
            <NavLink
              className={getNavLinkClass}
              to="/admin/trades"
              onClick={onClose}
            >
              Trades
            </NavLink>
          </li>
          <li>
            <NavLink
              className={getNavLinkClass}
              to="/admin/contacts"
              onClick={onClose}
            >
              Contacts
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app" onClick={onClose}>
              Client
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom User Info */}
      <Link to="/app/my-account" style={{ visibility: "hidden" }}>
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

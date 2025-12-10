import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import styles from "../../Layout/SideBar.module.css"

export const AdminSidebar = () => {
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
          <h3>Admin Panel</h3>
          <p>Log My Trade </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li>
            <NavLink className={getNavLinkClass} to="/admin/dashboard">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/admin/users">
              Users
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/admin/accounts">
              Accounts
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/admin/contacts">
              Contacts
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

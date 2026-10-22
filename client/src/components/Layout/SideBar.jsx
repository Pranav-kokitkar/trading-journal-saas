import styles from "./SideBar.module.css";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../store/Auth";
import { useTrades } from "../../store/TradeContext";
import {
  FaBalanceScale,
  FaChartBar,
  FaChartLine,
  FaHistory,
  FaLayerGroup,
  FaQuestionCircle,
  FaRocket,
  FaShieldAlt,
  FaStickyNote,
} from "react-icons/fa";

export const Sidebar = ({ onClose }) => {

  const { user, isAdmin, isPro, isAuthLoading } = useAuth();
  const { includeImportedTrades, setIncludeImportedTrades } = useTrades() || {};
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navlink} ${styles.active}` : `${styles.navlink}`; 
  };

  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <img
          src="/favicon2.ico"
          alt="Kyros Journal"
          className={styles.sidebarLogoImage}
        />
        <div className={styles.logoText}>
          <h3 className={styles.title}>
            Kyros <span>Journal</span>
          </h3>
          <p>Build Your Trading Edge</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <ul>
          <li>
            <NavLink className={getNavLinkClass} to="/app/dashboard" onClick={onClose}>
              <FaChartLine aria-hidden="true" /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/trade-history" onClick={onClose}>
              <FaHistory aria-hidden="true" /> Trade History
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/analytics" onClick={onClose}>
              <FaChartBar aria-hidden="true" /> Analytics
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/trade-setups" onClick={onClose}>
              <FaLayerGroup aria-hidden="true" /> Trade Setups
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/add-notes" onClick={onClose}>
              <FaStickyNote aria-hidden="true" /> Notes
            </NavLink>
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/compare" onClick={onClose}>
              <FaBalanceScale aria-hidden="true" /> Compare
            </NavLink>
          </li>
          {!isPro && (
            <li>
              <NavLink className={getNavLinkClass} to="/app/upgrade" onClick={onClose}>
                <FaRocket aria-hidden="true" /> Upgrade
              </NavLink>
            </li>
          )}
          <li>
            <NavLink className={getNavLinkClass} to="/app/contact" onClick={onClose}>
              <FaQuestionCircle aria-hidden="true" /> Get Help
            </NavLink>
          </li>
          <li>
            {isAdmin && (
              <NavLink className={getNavLinkClass} to="/admin" onClick={onClose}>
                <FaShieldAlt aria-hidden="true" /> Admin
              </NavLink>
            )}
          </li>
        </ul>
      </nav>

      <div className={styles.globalToggleWrap}>
        <label className={styles.globalToggleLabel}>
          <input
            type="checkbox"
            checked={Boolean(includeImportedTrades)}
            onChange={(e) =>
              typeof setIncludeImportedTrades === "function" &&
              setIncludeImportedTrades(e.target.checked)
            }
          />
          <span className={styles.toggleTrack} aria-hidden="true">
            <span className={styles.toggleThumb} />
          </span>
          <span>Include Imported Data</span>
        </label>
      </div>

      {/* Bottom User Info */}
      <Link to="/app/my-account" className={styles.user}>
        <div className={styles.avatar}>{userInitial}</div>
        <div className={styles.userMeta}>
          <p className={styles.username}>{!user ? "user" : `${user.name}`}</p>
          <span className={styles.subText}>Your Account</span>
        </div>
        {!isAuthLoading && isPro && <p className={styles.proBadge}>PRO</p>}
      </Link>
    </div>
  );
};
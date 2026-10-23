import { useEffect, useState } from "react";
import styles from "./SideBar.module.css";
import { NavLink, Link, useLocation } from "react-router-dom";
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
  FaClipboardCheck,
  FaChevronDown,
  FaChevronRight,
  FaTags,
  FaProjectDiagram,
} from "react-icons/fa";

export const Sidebar = ({ onClose }) => {

  const { user, isAdmin, isPro, isAuthLoading } = useAuth();
  const { includeImportedTrades, setIncludeImportedTrades } = useTrades() || {};
  const location = useLocation();
  const childRouteActive = ["/app/strategies", "/app/tags"].includes(location.pathname);
  const [setupsExpanded, setSetupsExpanded] = useState(childRouteActive);
  useEffect(() => {
    if (childRouteActive) setSetupsExpanded(true);
  }, [childRouteActive]);
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
            <button
              type="button"
              className={`${styles.navlink} ${styles.parentButton} ${childRouteActive ? styles.active : ""}`}
              onClick={() => setSetupsExpanded((expanded) => !expanded)}
              aria-expanded={setupsExpanded}
              aria-controls="strategies-tags-submenu"
            >
              <FaLayerGroup aria-hidden="true" />
              <span>Strategies &amp; Tags</span>
              {setupsExpanded ? <FaChevronDown className={styles.chevron} aria-hidden="true" /> : <FaChevronRight className={styles.chevron} aria-hidden="true" />}
            </button>
            {setupsExpanded && (
              <ul id="strategies-tags-submenu" className={styles.submenu}>
                <li>
                  <NavLink className={getNavLinkClass} to="/app/strategies" onClick={onClose}>
                    <FaProjectDiagram aria-hidden="true" /> Strategies
                  </NavLink>
                </li>
                <li>
                  <NavLink className={getNavLinkClass} to="/app/tags" onClick={onClose}>
                    <FaTags aria-hidden="true" /> Tags
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          <li>
            <NavLink className={getNavLinkClass} to="/app/trading-rules" onClick={onClose}>
              <FaClipboardCheck aria-hidden="true" /> Trading Rules
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
          <li className={styles.divider} aria-hidden="true" />
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

      <div className={styles.sidebarFooter}>
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

        <Link to="/app/my-account" className={styles.user}>
          <div className={styles.avatar}>{userInitial}</div>
          <div className={styles.userMeta}>
            <p className={styles.username}>{!user ? "user" : `${user.name}`}</p>
            <span className={styles.subText}>Your Account</span>
          </div>
          {!isAuthLoading && isPro && <p className={styles.proBadge}>PRO</p>}
        </Link>
      </div>
    </div>
  );
};
import styles from "./ErrorPage.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../../store/Auth";

export const ErrorPage = () => {
  const { isLoggedIn } = useAuth();

  const path = isLoggedIn ? "/app/dashboard" : "/";
  const label = isLoggedIn ? "Go To Dashboard" : "Go To HomePage";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <div className={styles.icon}>!</div>
        </div>

        <h1 className={styles.title}>Something went wrong</h1>

        <p className={styles.message}>
          We couldn’t load your trading journal. This might be a temporary
          network issue or a problem with the server. Try again or go back to
          the dashboard.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.retry}
            onClick={() => {
              window.location.reload();
            }}
          >
            Retry
          </button>

          <Link to={path} className={styles.back}>
            {label}
          </Link>
        </div>

        <details className={styles.details}>
          <summary className={styles.summary}>Technical details</summary>
          <pre className={styles.code}>
            {/* Replace this placeholder with real error message when available */}
            Error: Unable to fetch trades — network timeout
          </pre>
        </details>
      </div>
    </div>
  );
};

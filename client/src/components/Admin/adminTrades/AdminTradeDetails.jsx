import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";
import styles from "./AdminTradeDetails.module.css";

export const AdminTradeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/trades/${id}`,
        {
          headers: { Authorization: authorizationToken },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setTrade(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorizationToken && id) {
      fetchTrade();
    }
  }, [authorizationToken, id]);

  if (loading){
      return (
        <div className={styles.header}>
          <p className={styles.loading}>Loading...</p>
        </div>
      );
    }

  if (!trade) {
    return (
      <div className={styles.header}>
        <p className={styles.loading}>Trade not found</p>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          Back
        </button>
      </div>
    );
  }

  return (
    <section className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>Trade #{trade.tradeNumber}</h2>
          <p>{new Date(trade.dateTime).toLocaleString()}</p>
        </div>

        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          Back
        </button>
      </div>

      {/* User & Account */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <h4>User</h4>
          <p>{trade.userId?.name}</p>
          <span>{trade.userId?.email}</span>
        </div>

        <div className={styles.card}>
          <h4>Account</h4>
          <p>{trade.accountId?.name}</p>
          <span>Status: {trade.accountId?.status}</span>
        </div>
      </div>

      {/* Trade Info */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <h4>Trade Info</h4>
          <p>
            Market: <span>{trade.marketType}</span>
          </p>
          <p>
            Symbol: <span>{trade.symbol}</span>
          </p>
          <p>
            Direction:{" "}
            <span className={styles.direction}>{trade.tradeDirection}</span>
          </p>
          <p>
            Status: <span>{trade.tradeStatus}</span>
          </p>
          <p>
            Result: <span>{trade.tradeResult}</span>
          </p>
        </div>

        <div className={styles.card}>
          <h4>Prices</h4>
          <p>
            Entry: <span>{trade.entryPrice}</span>
          </p>
          <p>
            SL: <span>{trade.stoplossPrice}</span>
          </p>
          <p>
            TP: <span>{trade.takeProfitPrice}</span>
          </p>
        </div>
      </div>

      {/* Performance */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <h4>Performance</h4>
          <p>
            Risk Amount: <span>${trade.riskAmount}</span>
          </p>
          <p>
            Risk %: <span>{trade.riskPercent}%</span>
          </p>
          <p>
            RR: <span>{trade.rr}</span>
          </p>
          <p
            className={trade.pnl >= 0 ? styles.pnlPositive : styles.pnlNegative}
          >
            PnL: ${trade.pnl}
          </p>
          <p>
            Balance After Trade: <span>${trade.balanceAfterTrade}</span>
          </p>
        </div>

        <div className={styles.card}>
          <h4>Exit Prices</h4>
          {trade.exitedPrice?.length > 0 ? (
            trade.exitedPrice.map((e, i) => (
              <p key={i}>
                Exit {i + 1}: {e.price} ({e.volume}%)
              </p>
            ))
          ) : (
            <p className={styles.muted}>No exit data</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className={styles.card}>
        <h4>Trade Notes</h4>
        <p className={styles.notes}>{trade.tradeNotes || "No notes added"}</p>
      </div>

      {/* Screenshots */}
      <div className={styles.card}>
        <h4>Screenshots</h4>
        {trade.screenshots?.length > 0 ? (
          <div className={styles.screenshots}>
            {trade.screenshots.map((img, i) => (
              <img key={i} src={img} alt="trade screenshot" />
            ))}
          </div>
        ) : (
          <p className={styles.muted}>No screenshots</p>
        )}
      </div>
    </section>
  );
};

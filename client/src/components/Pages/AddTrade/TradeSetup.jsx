import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";
import { useAuth } from "../../../store/Auth";
import { useEffect, useState } from "react";

export const TradeSetup = ({ trade, handleChange }) => {
  const { authorizationToken } = useAuth();
  const [strategies, setStrategies] = useState([]);

  useEffect(() => {
    const getAllStrategies = async () => {
      try {
        const response = await fetch(
          `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/strategy`,
          {
            headers: {
              Authorization: authorizationToken,
            },
          },
        );

        const data = await response.json();
        if (response.ok) setStrategies(data);
      } catch (error) {
        console.error(error);
      }
    };

    getAllStrategies();
  }, [authorizationToken]);

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionHeader}>Trade Setup</h3>

      <div className={styles.sectionSpacingCompact}>
        <div className={styles.setupGridTop}>
          <div className={styles.inputGroup}>
            <label htmlFor="marketType">Market Type*</label>
            <select
              id="marketType"
              name="marketType"
              value={trade.marketType}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
              <option value="stocks">Stocks</option>
            </select>
          </div>

          <InputField
            label="Symbol"
            type="text"
            placeholder="e.g., BTCUSD"
            name="symbol"
            value={trade.symbol}
            onChange={handleChange}
            required={true}
          />
        </div>

        <div className={styles.setupMetaGrid}>
          <div className={styles.stackSpacing}>
            <div className={styles.sectionLabel}>Trade Direction</div>
            <div className={styles.directionControl} role="radiogroup" aria-label="Trade direction">
              <label className={`${styles.directionOption} ${styles.directionOptionLong} ${trade.tradedirection === "long" ? styles.directionOptionActive : ""}`}>
                <input
                  type="radio"
                  id="long"
                  name="tradedirection"
                  value="long"
                  checked={trade.tradedirection === "long"}
                  onChange={handleChange}
                  required
                />
                <span className={styles.directionIcon} aria-hidden="true">↑</span>
                <span className={styles.directionCopy}>
                  <strong>Long</strong>
                </span>
              </label>

              <label className={`${styles.directionOption} ${styles.directionOptionShort} ${trade.tradedirection === "short" ? styles.directionOptionActive : ""}`}>
                <input
                  type="radio"
                  id="short"
                  name="tradedirection"
                  value="short"
                  checked={trade.tradedirection === "short"}
                  onChange={handleChange}
                  required
                />
                <span className={styles.directionIcon} aria-hidden="true">↓</span>
                <span className={styles.directionCopy}>
                  <strong>Short</strong>
                </span>
              </label>
            </div>
          </div>

          <div className={styles.stackSpacing}>
            <div className={styles.sectionLabel}>Trade Type</div>
            <div className={styles.segmentedControl} role="radiogroup" aria-label="Trade type">
              <label className={`${styles.segmentedOption} ${styles.segmentedOptionLive} ${trade.tradeMode === "live" ? styles.segmentedOptionActive : ""}`}>
                <input
                  type="radio"
                  name="tradeMode"
                  value="live"
                  checked={trade.tradeMode === "live"}
                  onChange={handleChange}
                />
                <span>Live</span>
              </label>

              <label className={`${styles.segmentedOption} ${styles.segmentedOptionBacktest} ${trade.tradeMode === "backtest" ? styles.segmentedOptionActive : ""}`}>
                <input
                  type="radio"
                  name="tradeMode"
                  value="backtest"
                  checked={trade.tradeMode === "backtest"}
                  onChange={handleChange}
                />
                <span>Backtest</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.setupGridBottom}>
          <div className={styles.inputGroup}>
            <label htmlFor="strategy">Strategy (Optional)</label>
            <select
              id="strategy"
              name="strategy"
              value={trade.strategy || ""}
              onChange={handleChange}
            >
              <option value="">-- Select Strategy --</option>
              {strategies.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="session">Session (Optional)</label>
            <select
              id="session"
              name="session"
              value={trade.session || ""}
              onChange={handleChange}
            >
              <option value="">-- Select Session --</option>
              <option value="london">London</option>
              <option value="newyork">New York</option>
              <option value="asia">Asian</option>
              <option value="sydney">Sydney</option>
              <option value="tokyo">Tokyo</option>
              <option value="european">European</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
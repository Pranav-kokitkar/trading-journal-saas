import { useState, useEffect } from "react";
import styles from "./addtrade.module.css";

const SingleExit = ({ handleSingleExit }) => (
  <div className={styles.inputGroup}>
    <label htmlFor="exitPrice">Exit Price</label>
    <input
      type="number"
      id="exitPrice"
      name="exitPrice"
      step="any"
      onChange={(e) => handleSingleExit(e.target.value)}
      placeholder="Enter exit price"
      required
    />
  </div>
);

const MultipleExit = ({ exitLevels, handleExitChange, handleAddExitLevel }) => (
  <>
    <p className={styles.warning}>
      Total volume percentage must equal 100% across all exit levels.
    </p>

    {exitLevels.map((level, index) => (
      <div key={index} className={styles.row}>
        <input
          type="number"
          placeholder={`Exit Price ${index + 1}`}
          value={level.price}
          required
          onChange={(e) => handleExitChange(index, "price", e.target.value)}
        />
        <input
          type="number"
          placeholder="Volume %"
          value={level.volume}
          required
          onChange={(e) => handleExitChange(index, "volume", e.target.value)}
        />
      </div>
    ))}

    <button
      type="button"
      onClick={handleAddExitLevel}
      className={styles.addButton}
    >
      + Add Exit Level
    </button>
  </>
);

export const TradeStatus = ({ trade, handleChange, onExitChange }) => {
  const [isMultipleTP, setIsMultipleTP] = useState(false);
  const [exitLevels, setExitLevels] = useState([]);

  /** Force exited when backtesting */
  useEffect(() => {
    if (trade.tradeMode === "backtest" && trade.tradeStatus !== "exited") {
      handleChange({
        target: { name: "tradeStatus", value: "exited" },
      });
    }
  }, [trade.tradeMode, trade.tradeStatus, handleChange]);

  const handleAddExitLevel = () => {
    setExitLevels([...exitLevels, { price: "", volume: "" }]);
  };

  const handleExitChange = (index, field, value) => {
    const updated = [...exitLevels];
    updated[index][field] = value;
    setExitLevels(updated);
    onExitChange(updated);
  };

  return (
    <>
      {/* TRADE MODE */}
      <div className={styles.card}>
        <h3>Trade Mode*</h3>
        <div className={styles.radioContainer}>
          <div>
            <input
              type="radio"
              id="mode-live"
              name="tradeMode"
              value="live"
              checked={trade.tradeMode === "live"}
              onChange={handleChange}
              required
            />
            <label htmlFor="mode-live">Live</label>
          </div>

          <div>
            <input
              type="radio"
              id="mode-backtest"
              name="tradeMode"
              value="backtest"
              checked={trade.tradeMode === "backtest"}
              onChange={handleChange}
              required
            />
            <label htmlFor="mode-backtest">Backtest</label>
          </div>
        </div>
      </div>

      {/* TRADE STATUS (ONLY FOR LIVE MODE) */}
      {trade.tradeMode === "live" && (
        <div className={styles.card}>
          <h3>Trade Status*</h3>
          <div className={styles.radioContainer}>
            <div>
              <input
                type="radio"
                id="status-live"
                name="tradeStatus"
                value="live"
                checked={trade.tradeStatus === "live"}
                onChange={handleChange}
                required
              />
              <label htmlFor="status-live">Live (Ongoing)</label>
            </div>

            <div>
              <input
                type="radio"
                id="status-exited"
                name="tradeStatus"
                value="exited"
                checked={trade.tradeStatus === "exited"}
                onChange={handleChange}
                required
              />
              <label htmlFor="status-exited">Exited (Completed)</label>
            </div>
          </div>
        </div>
      )}
      {/* BACKTEST DATE SELECTOR */}
      {trade.tradeMode === "backtest" && (
        <div className={styles.card}>
          <h3>Trade Date (Entry)</h3>
          <div className={styles.inputGroup}>
            <label htmlFor="tradeDate">Select Date</label>
            <input
              type="date"
              id="tradeDate"
              name="tradeDate"
              value={trade.tradeDate || ""}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      )}

      {/* EXIT SECTION */}
      {trade.tradeStatus === "exited" && (
        <div className={styles.card}>
          <h3>Exit Details</h3>

          <label>
            <input
              type="checkbox"
              checked={isMultipleTP}
              onChange={() => setIsMultipleTP(!isMultipleTP)}
            />
            Multiple TP
          </label>

          {isMultipleTP ? (
            <MultipleExit
              exitLevels={exitLevels}
              handleExitChange={handleExitChange}
              handleAddExitLevel={handleAddExitLevel}
            />
          ) : (
            <SingleExit
              handleSingleExit={(value) =>
                onExitChange([{ price: value, volume: "100" }])
              }
            />
          )}
        </div>
      )}
    </>
  );
};

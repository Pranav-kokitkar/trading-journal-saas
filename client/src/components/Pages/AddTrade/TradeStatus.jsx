import { useState, useEffect } from "react";
import styles from "./addtrade.module.css";

const toDateTimeLocalValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const SingleExit = ({ handleSingleExit, exitTime, onExitTimeChange, minTime }) => (
  <div className={styles.inputGroup}>
    <div className={styles.row}>
      <div className={styles.col2}>
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
      <div className={styles.col2}>
        <label htmlFor="exitTime">Exit Time</label>
        <input
          type="datetime-local"
          id="exitTime"
          name="exitTime"
          value={exitTime}
          min={minTime}
          onChange={(e) => onExitTimeChange(e.target.value)}
          required
        />
      </div>
    </div>
  </div>
);

const MultipleExit = ({
  exitLevels,
  handleExitChange,
  handleAddExitLevel,
  entryTime,
}) => (
  <>
    <p className={styles.warning}>
      Total volume percentage must equal 100% across all exit levels.
    </p>

    {exitLevels.map((level, index) => (
      <div key={index} className={styles.row}>
        <div className={styles.col2}>
          <input
            type="number"
            placeholder={`Exit Price ${index + 1}`}
            value={level.price}
            required
            onChange={(e) => handleExitChange(index, "price", e.target.value)}
          />
        </div>
        <div className={styles.col2}>
          <input
            type="number"
            placeholder="Volume %"
            value={level.volume}
            required
            onChange={(e) => handleExitChange(index, "volume", e.target.value)}
          />
        </div>
        <div className={styles.col2}>
          <input
            type="datetime-local"
            value={level.timestamp || entryTime}
            min={entryTime}
            required
            onChange={(e) => handleExitChange(index, "timestamp", e.target.value)}
          />
        </div>
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
  const [singleExit, setSingleExit] = useState({
    price: "",
    timestamp: trade.entryTime || toDateTimeLocalValue(),
  });
  const defaultExitTime = trade.entryTime || toDateTimeLocalValue();

  /** Force exited when backtesting */
  useEffect(() => {
    if (trade.tradeMode === "backtest" && trade.tradeStatus !== "exited") {
      handleChange({
        target: { name: "tradeStatus", value: "exited" },
      });
    }
  }, [trade.tradeMode, trade.tradeStatus, handleChange]);

  useEffect(() => {
    setSingleExit((prev) => ({
      ...prev,
      timestamp: trade.entryTime || prev.timestamp || toDateTimeLocalValue(),
    }));
  }, [trade.entryTime]);

  const handleAddExitLevel = () => {
    setExitLevels([
      ...exitLevels,
      { price: "", volume: "", timestamp: defaultExitTime },
    ]);
  };

  useEffect(() => {
    if (trade.tradeStatus === "exited" && exitLevels.length === 0) {
      const initialExit = {
        price: "",
        volume: "100",
        timestamp: defaultExitTime,
      };
      setExitLevels([initialExit]);
      onExitChange([initialExit]);
    }
  }, [trade.tradeStatus, defaultExitTime, exitLevels.length, onExitChange]);
  /** Sync state when toggling between single and multiple TP */
  useEffect(() => {
    if (isMultipleTP && exitLevels.length === 0) {
      // Switching to multi-TP: initialize with current single exit
      const initialExit = {
        price: singleExit.price,
        volume: "100",
        timestamp: singleExit.timestamp || defaultExitTime,
      };
      setExitLevels([initialExit]);
      onExitChange([initialExit]);
    } else if (!isMultipleTP && exitLevels.length > 0) {
      // Switching to single-TP: use first exit level
      setSingleExit({
        price: exitLevels[0].price,
        timestamp: exitLevels[0].timestamp || defaultExitTime,
      });
      onExitChange([
        {
          price: exitLevels[0].price,
          volume: "100",
          timestamp: exitLevels[0].timestamp || defaultExitTime,
        },
      ]);
    }
  }, [isMultipleTP, exitLevels, singleExit, defaultExitTime, onExitChange]);
  const handleSingleExitTimeChange = (timestamp) => {
    setSingleExit((prev) => {
      const next = { ...prev, timestamp };
      onExitChange([{ price: next.price, volume: "100", timestamp: next.timestamp }]);
      return next;
    });
  };

  const handleExitChange = (index, field, value) => {
    setExitLevels((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      onExitChange(updated);
      return updated;
    });
  };

  return (
    <>
      {/* TRADE MODE */}
      <div className={styles.card}>
        <h3>Trade Mode</h3>
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
          <h3>Trade Status</h3>
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
            Multiple Take Profit
          </label>

          {isMultipleTP ? (
            <MultipleExit
              exitLevels={exitLevels}
              handleExitChange={handleExitChange}
              handleAddExitLevel={handleAddExitLevel}
              entryTime={defaultExitTime}
            />
          ) : (
            <SingleExit
              exitTime={singleExit.timestamp || defaultExitTime}
              onExitTimeChange={handleSingleExitTimeChange}
              minTime={defaultExitTime}
              handleSingleExit={(value) =>
                setSingleExit((prev) => {
                  const next = {
                    ...prev,
                    price: value,
                    timestamp: prev.timestamp || defaultExitTime,
                  };
                  onExitChange([
                    {
                      price: next.price,
                      volume: "100",
                      timestamp: next.timestamp,
                    },
                  ]);
                  return next;
                })
              }
            />
          )}
        </div>
      )}
    </>
  );
};

/* @refresh skip */
import { useState, useEffect } from "react";
import styles from "./addtrade.module.css";

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
            placeholder={`Enter exit price ${index + 1}...`}
            value={level.price}
            required
            onChange={(e) => handleExitChange(index, "price", e.target.value)}
          />
        </div>
        <div className={styles.col2}>
          <input
            type="number"
            placeholder="Enter volume %..."
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
    timestamp: trade.entryTime || "",
  });
  const defaultExitTime = trade.entryTime || "";

  useEffect(() => {
    setSingleExit((prev) => ({
      ...prev,
      timestamp: trade.entryTime || prev.timestamp || "",
    }));
  }, [trade.entryTime]);

  const handleAddExitLevel = () => {
    setExitLevels([
      ...exitLevels,
      { price: "", volume: "", timestamp: defaultExitTime },
    ]);
  };

  /** Sync state when toggling between single and multiple TP */
  useEffect(() => {
    if (isMultipleTP && exitLevels.length === 0) {
      // Switching to multi-TP: initialize with current single exit
      if (singleExit.price) {
        const initialExit = {
          price: singleExit.price,
          volume: "100",
          timestamp: singleExit.timestamp || defaultExitTime,
        };
        setExitLevels([initialExit]);
        onExitChange([initialExit]);
      }
    } else if (!isMultipleTP && exitLevels.length > 0 && exitLevels[0]?.price) {
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
    <div className={styles.card}>
      <h3 className={styles.sectionHeader}>Trade Execution</h3>

      <div className={styles.stackSpacing}>
        <div className={styles.segmentedControlStatus} role="radiogroup" aria-label="Trade status">
          <label className={`${styles.segmentedOption} ${styles.segmentedOptionOpen} ${trade.tradeStatus === "live" ? styles.segmentedOptionActive : ""}`}>
            <input
              type="radio"
              id="status-open"
              name="tradeStatus"
              value="live"
              checked={trade.tradeStatus === "live"}
              onChange={handleChange}
              required
            />
            <span>Open</span>
          </label>

          <label className={`${styles.segmentedOption} ${styles.segmentedOptionExited} ${trade.tradeStatus === "exited" ? styles.segmentedOptionActive : ""}`}>
            <input
              type="radio"
              id="status-exited"
              name="tradeStatus"
              value="exited"
              checked={trade.tradeStatus === "exited"}
              onChange={handleChange}
              required
            />
            <span>Exited</span>
          </label>

          <label className={`${styles.segmentedOption} ${styles.segmentedOptionMissed} ${trade.tradeStatus === "missed" ? styles.segmentedOptionActive : ""}`}>
            <input
              type="radio"
              id="status-missed"
              name="tradeStatus"
              value="missed"
              checked={trade.tradeStatus === "missed"}
              onChange={handleChange}
              required
            />
            <span>Missed</span>
          </label>
        </div>
      </div>

      {trade.tradeStatus === "exited" && (
        <div className={styles.outcomePanel}>
          <div className={styles.outcomeHeaderRow}>
            <h4>Exit Details</h4>

            <label className={styles.checkboxPill}>
              <input
                type="checkbox"
                checked={isMultipleTP}
                onChange={() => setIsMultipleTP(!isMultipleTP)}
              />
              <span>Multiple Take Profit</span>
            </label>
          </div>

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
    </div>
  );
};

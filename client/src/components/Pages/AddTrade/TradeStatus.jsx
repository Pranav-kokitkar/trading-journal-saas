import { useState } from "react";
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
    {/* Disclaimer */}
    <p className={styles.warning}>
      Total volume percentage must equal 100% across all exit levels.
    </p>

    {/* Render dynamic exit levels */}
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

    {/* Add Exit Level Button */}
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
    <div className={styles.card}>
      <h3>Trade Status</h3>
      <div className={styles.radioContainer}>
        <div>
          <input
            type="radio"
            id="live"
            name="tradeStatus"
            value="live"
            checked={trade.tradeStatus === "live"}
            onChange={handleChange}
            required
          />
          <label htmlFor="live">Live (Ongoing)</label>
        </div>
        <div>
          <input
            type="radio"
            id="exited"
            name="tradeStatus"
            value="exited"
            checked={trade.tradeStatus === "exited"}
            onChange={handleChange}
            required
          />
          <label htmlFor="exited">Exited (Completed)</label>
        </div>
      </div>

      {trade.tradeStatus === "exited" && (
        <div className={styles.exitedSection}>
          {/* Toggle button for Multiple TP */}
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
    </div>
  );
};

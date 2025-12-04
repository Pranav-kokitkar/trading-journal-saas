
import styles from "./Trade.module.css";

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

export const CloseTrade = ({
  isMultipleTP,
  setIsMultipleTP,
  exitLevels,
  handleExitChange,
  handleAddExitLevel,
  handleSingleExit,
  handleSave,
  onCancel,
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.card}>
        <h3>Close Trade</h3>

        {/* Exited Section */}
        <div className={styles.exitedSection}>
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
            <SingleExit handleSingleExit={handleSingleExit} />
          )}
        </div>

        <div className={styles.modalBtns}>
          <button onClick={handleSave} className={styles.saveBtn}>
            Save
          </button>
          <button onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

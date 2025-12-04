import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";

export const TradeInfo = ({
  trade,
  handleChange,
  screenshots,
  setScreenshots,
}) => {
  // handle file selection (max 2 images)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const limited = files.slice(0, 2); // enforce max: 2
    setScreenshots(limited);
  };

  return (
    <div className={styles.card}>
      <h3>Additional Info</h3>

      <div className={styles.col2}>
        {/* File input for screenshots */}
        <div>
          <label>Upload Screenshot (max 2)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          {screenshots && screenshots.length > 0 && (
            <small>{screenshots.length}/2 selected</small>
          )}
        </div>
      </div>

      <div className={styles.textareaGroup}>
        <label htmlFor="tradeNotes">Notes and Description</label>
        <textarea
          id="tradeNotes"
          name="tradeNotes"
          value={trade.tradeNotes}
          onChange={handleChange}
          placeholder="Add your trade analysis, strategy or any additional notes..."
        />
      </div>
    </div>
  );
};

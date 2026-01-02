import styles from "./addtrade.module.css";
import { useAuth } from "../../../store/Auth";

export const TradeInfo = ({
  trade,
  handleChange,
  screenshots,
  setScreenshots,
}) => {
  const { user, isPro } = useAuth();

  const uploadLimit = isPro ? 3 : 1;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > uploadLimit) {
      alert(`You can upload a maximum of ${uploadLimit} screenshots.`);
      e.target.value = "";
      return;
    }

    setScreenshots(files);
  };

  return (
    <div className={styles.card}>
      <h3>Additional Info</h3>

      <div className={styles.col2}>
        {/* File input for screenshots */}
        <div>
          <label>Upload Screenshot (max {uploadLimit})</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          {screenshots && screenshots.length > 0 && (
            <small>{screenshots.length}/{uploadLimit} selected</small>
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

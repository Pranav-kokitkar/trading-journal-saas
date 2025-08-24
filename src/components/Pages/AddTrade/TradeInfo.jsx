import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";

export const TradeInfo = ({ trade, handleChange }) => {
  return (
    <div className={styles.card}>
      <h3>Additional Info</h3>
      <div className={styles.col2}>
        <InputField label="Upload Screenshot" type="file" required={false} />
      </div>
      <div className={styles.col2}>
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

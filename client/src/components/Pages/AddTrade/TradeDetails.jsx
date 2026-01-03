import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";

export const TradeDetails = ({ trade, handleChange }) => {
  return (
    <div className={styles.card}>
      <h3>Trade Details</h3>

      <div className={styles.row}>
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
          label="Symbol Name:"
          type="text"
          placeholder="pair name"
          name="symbol"
          value={trade.symbol}
          onChange={handleChange}
          required={true}
        />
      </div>

      <div className={styles.tradedirection}>
        <label>Trade Direction*</label>
        <div className={styles.radioContainer}>
          <div>
            <input
              type="radio"
              id="long"
              name="tradedirection"
              value="long"
              checked={trade.tradedirection === "long"}
              onChange={handleChange}
              required
            />
            <label htmlFor="long">Long</label>
          </div>
          <div>
            <input
              type="radio"
              id="short"
              name="tradedirection"
              value="short"
              checked={trade.tradedirection === "short"}
              onChange={handleChange}
              required
            />
            <label htmlFor="short">Short</label>
          </div>
        </div>
      </div>
    </div>
  );
};

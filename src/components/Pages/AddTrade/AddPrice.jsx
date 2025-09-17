import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";

export const AddPrice = ({ trade, handleChange }) => {
  return (
    <div className={styles.card}>
      <h3>Price & Risk Management</h3>
      <p style={{ fontSize: "0.8rem", color: "gray",paddingBottom:"1rem" }}>
        Account Balance: ${trade.accountBalance}
      </p>

      <div className={styles.row}>
        <InputField
          label="Entry:"
          type="number"
          placeholder="Enter entry price"
          name="entryPrice"
          value={trade.entryPrice}
          onChange={handleChange}
          required={true}
        />
        <InputField
          label="Stoploss:"
          type="number"
          placeholder="Enter stoploss"
          name="stoplossPrice"
          value={trade.stoplossPrice}
          onChange={handleChange}
          required={true}
        />
      </div>

      <div className={styles.row}>
        <InputField
          label="Take Profit:"
          type="number"
          placeholder="Enter TP price"
          name="takeProfitPrice"
          value={trade.takeProfitPrice}
          onChange={handleChange}
          required={true}
        />
        <InputField
          label="Risk Amount:"
          type="number"
          placeholder="Enter risk amount"
          name="riskAmount"
          min="0"
          max={trade.accountBalance}
          value={trade.riskAmount}
          onChange={handleChange}
          required={true}
        />
      </div>
    </div>
  );
};

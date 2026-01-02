import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";
import { useContext } from "react";
import { AccountContext } from "../../../context/AccountContext";

export const AddPrice = ({ trade, handleChange }) => {
  const { accountDetails } = useContext(AccountContext);
  return (
    <div className={styles.card}>
      <h3>Price & Risk Management</h3>
      <p className={styles.subText}>
        Account Balance: ${accountDetails?.currentBalance}
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
        <div className={styles.row} style={{ marginBottom: "1rem" }}>
          <label>
            <input
              type="radio"
              name="riskType"
              value="dollar"
              checked={trade.riskType === "dollar"}
              onChange={handleChange}
            />{" "}
            $ Risk
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input
              type="radio"
              name="riskType"
              value="percent"
              checked={trade.riskType === "percent"}
              onChange={handleChange}
            />{" "}
            % Risk
          </label>
        </div>
      </div>
    </div>
  );
};

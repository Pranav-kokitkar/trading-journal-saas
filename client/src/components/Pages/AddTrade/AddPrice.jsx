import styles from "./addtrade.module.css";
import { InputField } from "../../InputField";
import { useContext } from "react";
import { AccountContext } from "../../../context/AccountContext";

const toDateTimeLocalValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export const AddPrice = ({ trade, handleChange }) => {
  const { accountDetails } = useContext(AccountContext);
  const riskTypeLabel =
    trade.riskType === "percent"
      ? "Risk (%):"
      : trade.riskType === "lots"
      ? "Lots:"
      : "Risk Amount:";

  const riskTypePlaceholder =
    trade.riskType === "percent"
      ? "Enter risk %..."
      : trade.riskType === "lots"
      ? "Enter lot size..."
      : "Enter risk amount...";

  return (
    <div className={styles.card}>
      <h3 className={styles.sectionHeader}>Price & Risk</h3>
      <p className={styles.subText}>
        Account Balance: ${accountDetails?.currentBalance?.toFixed(2)}
      </p>

      <div className={styles.row}>
        <InputField
          label="Entry Price"
          type="number"
          placeholder="Enter entry price..."
          name="entryPrice"
          value={trade.entryPrice}
          onChange={handleChange}
          required={true}
        />
        <InputField
          label="Entry Time"
          type="datetime-local"
          name="entryTime"
          value={trade.entryTime}
          max={toDateTimeLocalValue()}
          onChange={handleChange}
        />
      </div>

      <div className={styles.row}>
        <InputField
          label="Stop Loss"
          type="number"
          placeholder="Enter stop loss..."
          name="stoplossPrice"
          value={trade.stoplossPrice}
          onChange={handleChange}
          required={true}
        />
      </div>

      <div className={styles.row}>
        <InputField
          label="Take Profit"
          type="number"
          placeholder="Enter take profit..."
          name="takeProfitPrice"
          value={trade.takeProfitPrice}
          onChange={handleChange}
          required={true}
        />
        <div className={styles.riskStack}>
          <div className={styles.riskTypeGroup}>
            <span className={styles.riskTypeLabel}>Risk Type</span>
            <div className={styles.riskTypeOptions}>
              <label className={`${styles.riskTypeOption} ${trade.riskType === "dollar" ? styles.riskTypeOptionActive : ""}`}>
                <input
                  type="radio"
                  name="riskType"
                  value="dollar"
                  checked={trade.riskType === "dollar"}
                  onChange={handleChange}
                />
                <span>Dollar Risk</span>
              </label>
              <label className={`${styles.riskTypeOption} ${trade.riskType === "percent" ? styles.riskTypeOptionActive : ""}`}>
                <input
                  type="radio"
                  name="riskType"
                  value="percent"
                  checked={trade.riskType === "percent"}
                  onChange={handleChange}
                />
                <span>Percent Risk</span>
              </label>
              <label className={`${styles.riskTypeOption} ${trade.riskType === "lots" ? styles.riskTypeOptionActive : ""}`}>
                <input
                  type="radio"
                  name="riskType"
                  value="lots"
                  checked={trade.riskType === "lots"}
                  onChange={handleChange}
                />
                <span>Lots</span>
              </label>
            </div>
          </div>

          <InputField
            label={riskTypeLabel}
            type="number"
            placeholder={riskTypePlaceholder}
            name="riskAmount"
            value={trade.riskAmount}
            onChange={handleChange}
            required={true}
          />
        </div>
      </div>

      <div className={styles.costToggleRow}>
        <button
          type="button"
          className={styles.costToggleButton}
          onClick={() =>
            handleChange({
              target: { name: "showCosts", type: "checkbox", checked: !trade.showCosts },
            })
          }
          aria-pressed={Boolean(trade.showCosts)}
        >
          {trade.showCosts ? "Execution costs: On" : "Include slippage and commission"}
        </button>
      </div>

      {trade.showCosts && (
        <div className={styles.row}>
          <InputField
            label="Slippage"
            type="number"
            placeholder="Enter slippage cost..."
            name="slippage"
            value={trade.slippage}
            onChange={handleChange}
            min={0}
            step="any"
          />
          <InputField
            label="Commission"
            type="number"
            placeholder="Enter commission cost..."
            name="commission"
            value={trade.commission}
            onChange={handleChange}
            min={0}
            step="any"
          />
        </div>
      )}
    </div>
  );
};

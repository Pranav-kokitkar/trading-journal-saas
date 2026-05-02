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
      ? "Enter risk %"
      : trade.riskType === "lots"
      ? "Enter lot size"
      : "Enter risk amount";

  return (
    <div className={styles.card}>
      <h3>Price & Risk</h3>
      <p className={styles.subText}>
        Account Balance: ${accountDetails?.currentBalance?.toFixed(2)}
      </p>

      <div className={styles.row}>
        <InputField
          label="Entry Price"
          type="number"
          placeholder="Enter entry price"
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
          placeholder="Enter stoploss"
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
          placeholder="Enter TP price"
          name="takeProfitPrice"
          value={trade.takeProfitPrice}
          onChange={handleChange}
          required={true}
        />
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

      <div className={styles.costToggleRow}>
        <button
          type="button"
          onClick={() =>
            handleChange({
              target: { name: "showCosts", type: "checkbox", checked: !trade.showCosts },
            })
          }
          aria-pressed={Boolean(trade.showCosts)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: trade.showCosts ? "1px solid var(--accent)" : "1px solid #ccc",
            background: trade.showCosts ? "var(--accent)" : "transparent",
            color: trade.showCosts ? "#fff" : "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          {trade.showCosts ? "Execution costs: On" : "Include slippage and commission"}
        </button>
      </div>

      {trade.showCosts && (
        <div className={styles.row}>
          <InputField
            label="Slippage"
            type="number"
            placeholder="Enter slippage cost"
            name="slippage"
            value={trade.slippage}
            onChange={handleChange}
            min={0}
            step="any"
          />
          <InputField
            label="Commission"
            type="number"
            placeholder="Enter commission cost"
            name="commission"
            value={trade.commission}
            onChange={handleChange}
            min={0}
            step="any"
          />
        </div>
      )}

      <div
        className={styles.row}
        style={{ marginBottom: "1rem", alignItems: "center" }}
      >
        <label>
          <input
            type="radio"
            name="riskType"
            value="dollar"
            checked={trade.riskType === "dollar"}
            onChange={handleChange}
          />
          Dollar Risk
        </label>
        <label style={{ marginLeft: "1rem" }}>
          <input
            type="radio"
            name="riskType"
            value="percent"
            checked={trade.riskType === "percent"}
            onChange={handleChange}
          />
          Percent Risk
        </label>
        <label style={{ marginLeft: "1rem" }}>
          <input
            type="radio"
            name="riskType"
            value="lots"
            checked={trade.riskType === "lots"}
            onChange={handleChange}
          />
          Lots
        </label>
      </div>
    </div>
  );
};

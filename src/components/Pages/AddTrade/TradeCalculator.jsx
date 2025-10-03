import { useContext, useEffect } from "react";
import styles from "./addtrade.module.css";
import { AccountContext } from "../../../context/AccountContext";
import { calculateTradeValues } from "../../../utils/tradeUtils";

export const TradeCalculator = ({ trade, setTrade }) => {
  const { accountDetails } = useContext(AccountContext);
  const accountBalance = accountDetails?.balance || 0;

  const {
    rr,
    rrError,
    riskamount,
    lossError,
    lossWarning,
    pnl,
    profitError,
    generalError,
  } = calculateTradeValues({ trade, accountBalance });

  // Update trade state
  useEffect(() => {
    if (setTrade) {
      setTrade((prev) => ({
        ...prev,
        pnl,
        riskamount,
        rr,
      }));
    }
  }, [pnl, riskamount, rr]);

  return (
    <div className={styles.card}>
      <h3>Trade Calculator</h3>
      {generalError && (
        <p style={{ color: "red", fontWeight: "bold" }}>{generalError}</p>
      )}

      <div className={styles.row3}>
        <div className={styles.col2}>
          <p>
            RR: 1:<span>{rr}</span>
          </p>
          {rrError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{rrError}</p>
          )}
        </div>

        <div className={styles.col2}>
          <p>
            Risk Amount:{" "}
            <span>{riskamount !== "-" ? `$${riskamount}` : "-"}</span>
          </p>
          {lossError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{lossError}</p>
          )}
          {lossWarning && (
            <p style={{ color: "orange", fontSize: "0.9rem" }}>{lossWarning}</p>
          )}

          <p>
            PNL: <span>{pnl !== "-" ? `$${pnl}` : "-"}</span>
          </p>
          {profitError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{profitError}</p>
          )}
          {lossWarning && (
            <p style={{ color: "orange", fontSize: "0.9rem" }}>{lossWarning}</p>
          )}
        </div>
      </div>
    </div>
  );
};

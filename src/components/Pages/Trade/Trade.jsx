// Trade.jsx
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Trade.module.css";
import { useContext, useState } from "react";
import { CloseTrade } from "./CloseTrade";
import { calculateTradeOnExit } from "../../../utils/tradeUtils";
import { AccountContext } from "../../../context/AccountContext";
import { PerformanceContext } from "../../../context/PerformanceContext";

export const Trade = () => {

  const { accountDetails, setAccountDetails } = useContext(AccountContext);
  const { refreshPerformance } = useContext(PerformanceContext);

  const { id } = useParams();
  const navigate = useNavigate();
  const trades = JSON.parse(localStorage.getItem("trades")) || [];
  const trade = trades.find((t) => t.id === id);

  const [closeTrade, setCloseTrade] = useState(false);
  const [isMultipleTP, setIsMultipleTP] = useState(false);
  const [exitLevels, setExitLevels] = useState([]);
  const [tradeStatus, setTradeStatus] = useState(trade?.tradeStatus || "live");

  if (!trade) return <p>Trade not found</p>;

  // --- Exit Handlers ---
  const handleAddExitLevel = () => {
    setExitLevels([...exitLevels, { price: "", volume: "" }]);
  };

  const handleExitChange = (index, field, value) => {
    const updated = [...exitLevels];
    updated[index][field] = value;
    setExitLevels(updated);
  };

  const handleSingleExit = (value) => {
    setExitLevels([{ price: value, volume: "100" }]);
  };

  const handleStatusChange = (e) => {
    setTradeStatus(e.target.value);
  };

  const handleSave = () => {
    console.log("Exiting Save...", exitLevels);

    // Calculate updated trade
    const updatedTrade = calculateTradeOnExit({
      trade,
      exitLevels,
      accountBalance: accountDetails.balance, // use current balance
    });
    if (!updatedTrade) return;

    // Update trades array
    const updatedTrades = trades.map((t) =>
      String(t.id) === String(id) ? updatedTrade : t
    );

    console.log("Trade to update:", updatedTrade);

    // Save to localStorage
    localStorage.setItem("trades", JSON.stringify(updatedTrades));

    // ===== Add PNL to account balance =====
    const newBalance =
      accountDetails.balance + parseFloat(updatedTrade.pnl || 0);
    setAccountDetails({
      ...accountDetails,
      balance: newBalance,
    });

    // Close modal
    setCloseTrade(false);

    // Navigate back
    navigate(`/trade/${id}`);
    refreshPerformance();
  };

  const handleDelete = () => {
    const updatedTrades = trades.filter((t) => String(t.id) !== String(id));
    localStorage.setItem("trades", JSON.stringify(updatedTrades));
    navigate("/trade-history");
  };

  // Colors
  const pnlColor = trade.pnl >= 0 ? "positive" : "negative";
  const directionColor =
    trade.tradedirection.toLowerCase() === "long" ? "long" : "short";

  return (
    <section className={styles.trade}>
      <div className={styles.tradeContainer}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h2>Trade Details</h2>
            <p>{trade.dateNtime}</p>
          </div>
          <div
            className={`${styles.marketType} ${trade.marketType.toLowerCase()}`}
          >
            {trade.marketType}
          </div>
        </header>

        {/* Trade Info & Performance */}
        <div className={styles.tradeData}>
          <div className={styles.tradeInfo}>
            <h4>Trade Information</h4>
            <p>
              Direction:{" "}
              <span className={directionColor}>{trade.tradedirection}</span>
            </p>
            <p>
              Entry Price: <span>{trade.entryPrice}</span>
            </p>
            <p>
              Stop Loss: <span>{trade.stoplossPrice}</span>
            </p>
            <p>
              Take Profit: <span>{trade.takeProfitPrice}</span>
            </p>
          </div>

          <div className={styles.tradePerformance}>
            <h4>Performance</h4>
            <p>
              Risk Amount: <span>${trade.riskamount}</span>
            </p>
            <p>
              RR: 1:<span>{trade.rr}</span>
            </p>
            <p>
              PNL: <span className={pnlColor}>${trade.pnl}</span>
            </p>
          </div>

          <div className={styles.exitPrice}>
            <h4>Exit Prices</h4>
            {trade.tradeStatus === "live"
              ? "Trade Is Live (add Exit Price)"
              : trade.exitedPrice.map((exitedPrice, index) => (
                  <div key={index} className={styles.exitPriceData}>
                    <p>
                      Exit Price {index + 1}: <span>{exitedPrice.price}</span>
                    </p>
                    <p>
                      Volume: <span>{exitedPrice.volume}%</span>
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Notes */}
        <div className={styles.tradeDescription}>
          <h4>Trade Notes</h4>
          <p>{trade.tradeNotes}</p>
        </div>

        {/* Screenshot */}
        <div className={styles.tradeScreenshot}>
          <p>Screenshot / Chart Placeholder</p>
        </div>

        {/* Buttons */}
        <div className={styles.tradeBtns}>
          <button className={styles.editTrade}>Edit Trade</button>
          <button
            onClick={() => setCloseTrade(true)}
            className={styles.closeTrade}
          >
            Close Trade
          </button>
          <button className={styles.deleteTrade} onClick={handleDelete}>
            Delete Trade
          </button>
        </div>
      </div>
      {closeTrade && (
        <CloseTrade
          tradeStatus={tradeStatus}
          handleStatusChange={handleStatusChange}
          isMultipleTP={isMultipleTP}
          setIsMultipleTP={setIsMultipleTP}
          exitLevels={exitLevels}
          handleExitChange={handleExitChange}
          handleAddExitLevel={handleAddExitLevel}
          handleSingleExit={handleSingleExit}
          handleSave={handleSave}
          onCancel={() => setCloseTrade(false)}
        />
      )}
    </section>
  );
};

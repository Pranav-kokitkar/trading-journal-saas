// Trade.jsx
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Trade.module.css";
import { useContext, useState, useEffect } from "react";
import { CloseTrade } from "./CloseTrade";
import { calculateTradeOnExit } from "../../../utils/tradeUtils";
import { AccountContext } from "../../../context/AccountContext";
import { PerformanceContext } from "../../../context/PerformanceContext";
import { useTrades } from "../../../store/TradeContext";
import { useAuth } from "../../../store/Auth";

export const Trade = () => {
  const { accountDetails, setAccountDetails } = useContext(AccountContext);
  const { refreshPerformance } = useContext(PerformanceContext);

  const { id } = useParams();
  const navigate = useNavigate();

  // get trades
  const { trades = [], refreshTrades, closeTradeByID } = useTrades() || {};

  const [closeTrade, setCloseTrade] = useState(false);
  const [isMultipleTP, setIsMultipleTP] = useState(false);
  const [exitLevels, setExitLevels] = useState([]);
  const [tradeStatus, setTradeStatus] = useState("live");

  const [isLoading, setIsLoading] = useState(false);
  const [triedRefresh, setTriedRefresh] = useState(false);

  const { authorizationToken } = useAuth();

  // helper to find trade by several possible id fields
  const findTradeById = (list, idParam) => {
    if (!Array.isArray(list)) return undefined;
    return list.find((t) => {
      const tId = t.id ?? t._id ?? t.tradeNumber;
      return String(tId) === String(idParam);
    });
  };

  // Try to find trade in context
  const trade = findTradeById(trades, id);

  // keep tradeStatus synced when we have trade
  useEffect(() => {
    if (trade) {
      setTradeStatus(trade.tradeStatus ?? "live");
    }
  }, [trade]);

  // If trade is missing, attempt one guarded refresh of the context trades (context-first approach)
  useEffect(() => {
    let mounted = true;
    const tryRefresh = async () => {
      if (trade || triedRefresh || typeof refreshTrades !== "function") return;
      try {
        setIsLoading(true);
        await refreshTrades();
      } catch (err) {
        console.error("refreshTrades failed", err);
      } finally {
        if (mounted) {
          setTriedRefresh(true);
          setIsLoading(false);
        }
      }
    };
    tryRefresh();
    return () => {
      mounted = false;
    };
    // only re-run if id changes or refreshTrades identity changes
  }, [id, trade, triedRefresh, refreshTrades]);

  if (isLoading) return <p>Loading trade…</p>;
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

  const handleSave = async () => {
    // basic validation: there must be at least one exit level
    if (!Array.isArray(exitLevels) || exitLevels.length === 0) {
      alert("Please enter at least one exit price.");
      return;
    }

    // If using percent volumes, ensure they sum to ~100
    const totalPct = exitLevels.reduce((s, l) => s + Number(l.volume || 0), 0);
    if (totalPct > 0 && Math.abs(totalPct - 100) > 0.1) {
      alert(
        "Total exit volume must equal 100% (or leave volumes 0 if using absolute qty)."
      );
      return;
    }

    setIsLoading(true);
    try {
      // 1) compute updated trade using your util
      const updatedTrade = calculateTradeOnExit({
        trade,
        exitLevels,
        accountBalance: accountDetails?.balance ?? 0,
      });

      if (!updatedTrade) {
        throw new Error("Calculation failed");
      }

      // normalize exitedPrice shape to send to backend (numbers)
      const exitedPrice = (updatedTrade.exitedPrice || exitLevels || []).map(
        (lvl) => ({
          price: Number(lvl.price),
          volume: Number(lvl.volume),
        })
      );

      // derive fields backend expects
      const pnl = Number(updatedTrade.pnl || 0);
      const rr = Number(updatedTrade.rr || 0);
      const tradeResult = updatedTrade.tradeResult || "breakeven";
      const balanceAfterTrade = Number(
        updatedTrade.balanceAfterTrade || accountDetails?.balance + pnl || 0
      );

      console.log("CALC INPUTS", {
        tradeId: trade._id,
        dir: trade.tradeDirection || trade.tradedirection,
        entry: Number(trade.entryPrice),
        exitLevels,
        exitFirst: Number(exitLevels[0]?.price),
        quantity: trade.quantity || trade.positionSize || trade.riskAmount,
        pnlPreview: updatedTrade.pnl,
      });

      // 2) call TradeContext API to close on server
      const closedTrade = await closeTradeByID(
        trade._id || trade.id,
        exitedPrice,
        pnl,
        rr,
        tradeResult,
        balanceAfterTrade
      );

      if (!closedTrade) {
        throw new Error("Server did not return updated trade.");
      }

      // 3) refresh local lists & performance (server is source of truth)
      await refreshTrades();

      // update account snapshot locally (prefer server-sent value if available)
      setAccountDetails((prev) => ({
        ...prev,
        balance:
          closedTrade.balanceAfterTrade ??
          prev.balance + (closedTrade.pnl ?? pnl),
      }));

      // refresh analytics/charts
      if (typeof refreshPerformance === "function") refreshPerformance();

      // close modal & stay on same page (trade will now be closed)
      setCloseTrade(false);
      navigate(`/app/trade/${id}`);
    } catch (err) {
      console.error("Error saving trade exit:", err);
      alert(err.message || "Failed to save trade exit — check console");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trade? This cannot be undone.")) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/trades/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );
      if (response.ok) {
        await refreshTrades();
        setAccountDetails((prev) => ({
          ...prev,
          balance: prev.balance - parseFloat(trade.pnl || 0),
          totaltrades: (prev.totaltrades || 1) - 1,
        }));
        // Refresh charts
        refreshPerformance();
        navigate("/app/trade-history");
      } else {
        console.log("unable to delete");
      }
    } catch (err) {
      console.error("Failed to delete trade:", err);
      alert("Failed to delete trade — check console");
    }
  };

  // Colors
  const pnlColor = trade.pnl >= 0 ? "positive" : "negative";
  const directionColor =
    trade.tradedirection?.toLowerCase() === "long" ? "long" : "short";

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
            className={`${
              styles.marketType
            } ${trade.marketType?.toLowerCase()}`}
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
              <span className={directionColor}>{trade.tradeDirection}</span>
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
              Risk Amount: <span>${trade.riskAmount}</span>
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
          <button
            className={styles.deleteTrade}
            onClick={() => handleDelete(trade._id)}
          >
            Delete Trade
          </button>
          {trade.tradeStatus === "live" && (
            <button
              onClick={() => setCloseTrade(true)}
              className={styles.closeTrade}
            >
              Close Trade
            </button>
          )}
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

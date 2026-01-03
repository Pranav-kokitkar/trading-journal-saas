// src/components/.../Trade.jsx
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Trade.module.css";
import { useContext, useState, useEffect } from "react";
import { CloseTrade } from "./CloseTrade";
import { calculateTradeOnExit } from "../../../utils/tradeUtils";
import { TradeContext, useTrades } from "../../../store/TradeContext";
import { useAuth } from "../../../store/Auth";
import { toast } from "react-toastify";
import { AccountContext } from "../../../context/AccountContext";
import { ConfirmationModal } from "../../modals/ConfirmationModal/ConfirmationModal";

export const Trade = () => {
  const { accountDetails, updateAccount } = useContext(AccountContext);
  const { deleteTradeByID } = useContext(TradeContext);

  const { id } = useParams();
  const navigate = useNavigate();

  // get trades
  const { trades = [], refreshTrades, closeTradeByID } = useTrades() || {};

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [updatedNote, setUpdatedNote] = useState("");
  const [closeTrade, setCloseTrade] = useState(false);
  const [isMultipleTP, setIsMultipleTP] = useState(false);
  const [exitLevels, setExitLevels] = useState([]);
  const [tradeStatus, setTradeStatus] = useState("live");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [triedRefresh, setTriedRefresh] = useState(false);

  // ✅ NEW: local state to hold trade fetched directly by ID (for refresh / deep link)
  const [fetchedTrade, setFetchedTrade] = useState(null);

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
  const contextTrade = findTradeById(trades, id);

  // ✅ Use trade from context if available, otherwise fall back to fetchedTrade
  const trade = contextTrade || fetchedTrade;

  // keep tradeStatus synced when we have trade
  useEffect(() => {
    if (trade) {
      setTradeStatus(trade.tradeStatus ?? "live");
    }
  }, [trade]);

  // ✅ NEW: if trade is not in context, fetch it directly from backend by ID
  useEffect(() => {
    const fetchSingleTrade = async () => {
      // if we already have it from context or no token, skip
      if (contextTrade || !authorizationToken) return;

      try {
        setIsLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/trades/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: authorizationToken,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setFetchedTrade(data);
        } else {
          console.error("Failed to fetch trade by id:", res.status);
        }
      } catch (err) {
        console.error("Error fetching trade by id:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSingleTrade();
  }, [id, contextTrade, authorizationToken]);

  // If trade is missing, attempt one guarded refresh of the context trades (context-first approach)
  useEffect(() => {
    let mounted = true;
    const tryRefresh = async () => {
      // if we already have a trade (from context or fetch) or we already tried, or no refresh function
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
    // only re-run if id changes or refreshTrades identity changes, or trade/triedRefresh changes
  }, [id, trade, triedRefresh, refreshTrades]);

  if (isLoading && !trade) return <p>Loading trade…</p>;
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
        accountBalance: accountDetails?.currentBalance ?? 0,
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
        updatedTrade.balanceAfterTrade || accountDetails?.currentBalance + pnl || 0
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

      // Optional: keep local fetchedTrade in sync if we fetched it directly
      setFetchedTrade(closedTrade);

      // 3) refresh local lists & performance (server is source of truth)
      await refreshTrades();

      // 4) update account on server by sending pnl (do NOT change totalTrades when closing)
      try {
        if (typeof updateAccount === "function") {
          await updateAccount({ pnl });
        }
      } catch (err) {
        console.error("updateAccount failed", err);
        // we continue — server trade was closed; account sync can be retried
      }

      // refresh analytics/charts

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


  const handleEdit = () => {
    setIsEditingNote(true);
    if (trade.tradeNotes) {
      setUpdatedNote(trade.tradeNotes);
    } else {
      setUpdatedNote("");
    }
  };

  const SaveNote = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${id}/note`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify({
            tradeNotes: updatedNote,
          }),
        }
      );
      if (response.ok) {
        setIsEditingNote(false);
        refreshTrades();
        toast.success("Note Updated", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } else {
        toast.error("Failed to update note", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

    const onDelete = async (id) => {
      setIsDeleteModalOpen(true);
    };

    const confirmDeleteAccount = async (id)=>{
      try {
        await deleteTradeByID(id, trade.pnl);
        navigate("/app/trade-history");
      } catch (error) {
        console.log(error);
      }
    }


  // Colors
  const pnlColor = trade.pnl >= 0 ? "positive" : "negative";
  const directionColor =
    trade.tradedirection?.toLowerCase() === "long" ? "long" : "short";

  return (
    <section className={styles.trade}>
      <div className={styles.tradeContainer}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <h2>
              Trade Details: <span>{trade.symbol}</span>
            </h2>
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
          <div className={styles.notesHeader}>
            <h4>Trade Notes</h4>
            {!isEditingNote ? (
              <button onClick={handleEdit} className={styles.notebtn}>
                {trade.tradeNotes ? "Edit" : "Add"}
              </button>
            ) : (
              <button
                onClick={() => SaveNote(trade._id)}
                className={styles.notebtn}
              >
                Save
              </button>
            )}
          </div>

          <div>
            {isEditingNote ? (
              <textarea
                name="tradeNotes"
                value={updatedNote}
                onChange={(e) => setUpdatedNote(e.target.value)}
                className={styles.editTextArea}
              />
            ) : (
              <div>
                {trade.tradeNotes ? (
                  <p>{trade.tradeNotes}</p>
                ) : (
                  <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                    No notes added
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Screenshot */}
        <div className={styles.tradeScreenshot}>
          <p>Screenshot / Chart Placeholder</p>

          {Array.isArray(trade.screenshots) && trade.screenshots.length > 0 && (
            <div className={styles.screenshotList}>
              {trade.screenshots.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Trade screenshot ${index + 1}`}
                />
              ))}
            </div>
          )}

          {(!Array.isArray(trade.screenshots) ||
            trade.screenshots.length === 0) && (
            <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
              No screenshots added
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className={styles.tradeBtns}>
          <button className={styles.deleteTrade} onClick={onDelete}>
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
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete This Trade?"
        message="This action cannot be undone."
        confirmText="Delete Trade"
        cancelText="Cancel"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => confirmDeleteAccount(trade._id)}
      />

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

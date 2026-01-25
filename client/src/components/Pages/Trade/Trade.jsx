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
  const [isAddingTags, setIsAddingTags] = useState(false);
  const [updatedNote, setUpdatedNote] = useState("");
  const [closeTrade, setCloseTrade] = useState(false);
  const [isMultipleTP, setIsMultipleTP] = useState(false);
  const [exitLevels, setExitLevels] = useState([]);
  const [tradeStatus, setTradeStatus] = useState("live");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteScreenshotModalOpen, setIsDeleteScreenshotModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [triedRefresh, setTriedRefresh] = useState(false);

  const [fetchedTrade, setFetchedTrade] = useState(null);

  // Tags state
  const [allTags, setAllTags] = useState([]);
  const [editableTags, setEditableTags] = useState([]);

  // ✅ NEW: Screenshot state
  const [isEditingScreenshots, setIsEditingScreenshots] = useState(false);
  const [newScreenshots, setNewScreenshots] = useState([]);

  const { authorizationToken } = useAuth();

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [screenshotToDelete, setScreenshotToDelete] = useState(null);

  // Add handler after saveScreenshots function
  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const openScreenshotDeleteModal = ()=>{
    setIsDeleteScreenshotModalOpen(true);
  }

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

  // Use trade from context if available, otherwise fall back to fetchedTrade
  const trade = fetchedTrade || contextTrade;

  // keep tradeStatus synced when we have trade
  useEffect(() => {
    if (trade) {
      setTradeStatus(trade.tradeStatus ?? "live");
    }
  }, [trade]);

  // if trade is not in context, fetch it directly from backend by ID
  useEffect(() => {
    const fetchSingleTrade = async () => {
      if (!authorizationToken) return;

      try {
        setIsLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/trades/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: authorizationToken,
            },
          },
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

  // If trade is missing, attempt one guarded refresh of the context trades
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
    if (!Array.isArray(exitLevels) || exitLevels.length === 0) {
      alert("Please enter at least one exit price.");
      return;
    }

    const totalPct = exitLevels.reduce((s, l) => s + Number(l.volume || 0), 0);
    if (totalPct > 0 && Math.abs(totalPct - 100) > 0.1) {
      alert(
        "Total exit volume must equal 100% (or leave volumes 0 if using absolute qty).",
      );
      return;
    }

    setIsLoading(true);
    try {
      const updatedTrade = calculateTradeOnExit({
        trade,
        exitLevels,
        accountBalance: accountDetails?.currentBalance ?? 0,
      });

      if (!updatedTrade) {
        throw new Error("Calculation failed");
      }

      const exitedPrice = (updatedTrade.exitedPrice || exitLevels || []).map(
        (lvl) => ({
          price: Number(lvl.price),
          volume: Number(lvl.volume),
        }),
      );

      const pnl = Number(updatedTrade.pnl || 0);
      const rr = Number(updatedTrade.rr || 0);
      const tradeResult = updatedTrade.tradeResult || "breakeven";
      const balanceAfterTrade = Number(
        updatedTrade.balanceAfterTrade ||
          accountDetails?.currentBalance + pnl ||
          0,
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

      const closedTrade = await closeTradeByID(
        trade._id || trade.id,
        exitedPrice,
        pnl,
        rr,
        tradeResult,
        balanceAfterTrade,
      );

      if (!closedTrade) {
        throw new Error("Server did not return updated trade.");
      }

      setFetchedTrade(closedTrade);
      await refreshTrades();

      try {
        if (typeof updateAccount === "function") {
          await updateAccount({ pnl });
        }
      } catch (err) {
        console.error("updateAccount failed", err);
      }

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
        },
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

  // Tag handlers
  const handleAddTags = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tags`, {
        headers: {
          Authorization: authorizationToken,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAllTags(data);
        setEditableTags((trade.tags || []).map((t) => t._id));
        setIsAddingTags(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTag = (tagId) => {
    setEditableTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const saveTags = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${trade._id}/tags`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify({
            tags: editableTags,
          }),
        },
      );

      if (response.ok) {
        setIsAddingTags(false);
        await refreshTrades();

        const updated = await response.json();
        if (fetchedTrade) {
          setFetchedTrade(updated);
        }

        toast.success("Tags Updated", {
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
        toast.error("Failed to update tags", {
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
      console.error(error);
      toast.error("Error updating tags", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  // ✅ NEW: Screenshot handlers
  const handleEditScreenshots = () => {
    setIsEditingScreenshots(true);
  };

  const handleScreenshotFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const uploadLimit = 3;

    if (files.length > uploadLimit) {
      alert(`You can upload a maximum of ${uploadLimit} screenshots.`);
      e.target.value = "";
      return;
    }

    setNewScreenshots(files);
  };

  const deleteScreenshot = async (screenshotUrl) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${trade._id}/screenshot`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
          body: JSON.stringify({ screenshotUrl }),
        },
      );

      if (response.ok) {
        await refreshTrades();

        const updated = await response.json();
        if (fetchedTrade) {
          setFetchedTrade(updated);
        }

        toast.success("Screenshot deleted", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      } else {
        toast.error("Failed to delete screenshot", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting screenshot", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  const saveScreenshots = async () => {
    if (newScreenshots.length === 0) {
      toast.error("Please select at least one screenshot", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    try {
      const formData = new FormData();
      newScreenshots.forEach((file) => {
        formData.append("screenshots", file);
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trades/${trade._id}/screenshots`,
        {
          method: "PATCH",
          headers: {
            Authorization: authorizationToken,
          },
          body: formData,
        },
      );

      if (response.ok) {
        setIsEditingScreenshots(false);
        setNewScreenshots([]);
        await refreshTrades();

        const updated = await response.json();
        if (fetchedTrade) {
          setFetchedTrade(updated);
        }

        toast.success("Screenshots added", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      } else {
        toast.error("Failed to add screenshots", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error adding screenshots", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark",
      });
    }
  };

  const onDelete = async (id) => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async (id) => {
    try {
      await deleteTradeByID(id, trade.pnl);
      navigate("/app/trade-history");
    } catch (error) {
      console.log(error);
    }
  };

  // Colors
  const pnlColor = trade.pnl >= 0 ? "positive" : "negative";
  const directionColor =
    trade.tradedirection?.toLowerCase() === "long" ? "long" : "short";

  console.log(trade);

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

        {/*Tags*/}
        <div className={styles.tradeTags}>
          <div className={styles.notesHeader}>
            <h4>Tags</h4>
            {!isAddingTags ? (
              <button onClick={handleAddTags} className={styles.notebtn}>
                {Array.isArray(trade.tags) && trade.tags.length > 0
                  ? "Edit"
                  : "Add"}
              </button>
            ) : (
              <button onClick={saveTags} className={styles.notebtn}>
                Save
              </button>
            )}
          </div>

          {!isAddingTags ? (
            Array.isArray(trade.tags) && trade.tags.length > 0 ? (
              <div className={styles.tagsContainer}>
                {trade.tags.map((tag) => (
                  <span
                    key={tag._id}
                    className={styles.tagBadge}
                    style={{ backgroundColor: tag.colour }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.7,
                  marginTop: "0.75rem",
                }}
              >
                No tags added
              </p>
            )
          ) : (
            <div className={styles.tagPicker}>
              {allTags.length === 0 ? (
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  No tags available. Create tags in the Tags page.
                </p>
              ) : (
                allTags.map((t) => {
                  const isSelected = editableTags.includes(t._id);

                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => toggleTag(t._id)}
                      className={
                        isSelected ? styles.tagSelected : styles.tagUnselected
                      }
                      style={{
                        backgroundColor: isSelected ? t.colour : "transparent",
                        color: isSelected ? "#fff" : t.colour,
                        borderColor: t.colour,
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })
              )}
            </div>
          )}
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

        {/* ✅ Screenshot - UPDATED SECTION */}
        <div className={styles.tradeScreenshot}>
          <div className={styles.notesHeader}>
            <p>Screenshots</p>
            {!isEditingScreenshots ? (
              <button
                onClick={handleEditScreenshots}
                className={styles.notebtn}
              >
                Add
              </button>
            ) : (
              <button onClick={saveScreenshots} className={styles.notebtn}>
                Save
              </button>
            )}
          </div>

          {isEditingScreenshots && (
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleScreenshotFileChange}
                className={styles.fileInput}
              />
              {newScreenshots.length > 0 && (
                <small
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--muted)",
                    marginTop: "0.5rem",
                    display: "block",
                  }}
                >
                  {newScreenshots.length} file(s) selected
                </small>
              )}
            </div>
          )}

          {Array.isArray(trade.screenshots) && trade.screenshots.length > 0 ? (
            <div className={styles.screenshotList}>
              {trade.screenshots.map((url, index) => (
                <div key={index} className={styles.screenshotItem}>
                  <img
                    src={url}
                    alt={`Trade screenshot ${index + 1}`}
                    onClick={() => openFullscreen(url)}
                    style={{ cursor: "pointer" }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setScreenshotToDelete(url);
                      openScreenshotDeleteModal();
                    }}
                    className={styles.deleteScreenshotBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: "0.85rem",
                opacity: 0.7,
                marginTop: "0.75rem",
              }}
            >
              No screenshots added
            </p>
          )}

          {/* ✅ NEW: Fullscreen Modal */}
          {fullscreenImage && (
            <div className={styles.fullscreenOverlay} onClick={closeFullscreen}>
              <button
                className={styles.fullscreenClose}
                onClick={closeFullscreen}
              >
                ✕
              </button>
              <img
                src={fullscreenImage}
                alt="Fullscreen view"
                className={styles.fullscreenImage}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
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
      <ConfirmationModal
        isOpen={isDeleteScreenshotModalOpen}
        title="Delete Screenshot?"
        message="This screenshot will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setIsDeleteScreenshotModalOpen(false);
          setScreenshotToDelete(null);
        }}
        onConfirm={() => {
          if (screenshotToDelete) {
            deleteScreenshot(screenshotToDelete);
          }
          setIsDeleteScreenshotModalOpen(false);
          setScreenshotToDelete(null);
        }}
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

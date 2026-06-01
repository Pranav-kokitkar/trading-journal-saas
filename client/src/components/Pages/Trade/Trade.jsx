// src/components/.../Trade.jsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import styles from "./Trade.module.css";
import { useContext, useState, useEffect, useRef } from "react";
import { CloseTrade } from "./CloseTrade";
import { calculateTradeOnExit } from "../../../utils/tradeUtils";
import { TradeContext, useTrades } from "../../../store/TradeContext";
import { useAuth } from "../../../store/Auth";
import { toastHelper } from "../../../utils/toastHelper";
import { AccountContext } from "../../../context/AccountContext";
import { ConfirmationModal } from "../../modals/ConfirmationModal/ConfirmationModal";
import { SkeletonCard, SkeletonText } from "../../ui/skeleton/Skeleton";
import { TradeChart } from "../../trade/TradeChart";
import { formatDateTimeUtc } from "../../../utils/formatDateTimeUtc";
import { getMaxScreenshots } from "../../../config/planLimits";

const formatDuration = (trade) => {
  if (trade?.durationText) return trade.durationText;
  const minutes = Number(trade?.durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  return `${(minutes / 60).toFixed(minutes >= 240 ? 0 : 1)}h`;
};

const formatDirectionLabel = (value) => {
  if (!value) return "—";
  const normalized = String(value).trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

export const Trade = () => {
  const { accountDetails, updateAccount } = useContext(AccountContext);
  const { deleteTradeByID } = useContext(TradeContext);

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const historyState = location.state || {};

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
  const [activeTab, setActiveTab] = useState("chart");
  const [selectedScreenshots, setSelectedScreenshots] = useState([]);
  const [isUploadingScreenshots, setIsUploadingScreenshots] = useState(false);
  const screenshotInputRef = useRef(null);
  const [isConfidencePickerOpen, setIsConfidencePickerOpen] = useState(false);
  const [confidenceDraft, setConfidenceDraft] = useState(null);
  const [isGradePickerOpen, setIsGradePickerOpen] = useState(false);
  const [isSessionPickerOpen, setIsSessionPickerOpen] = useState(false);
  const [isStrategyPickerOpen, setIsStrategyPickerOpen] = useState(false);
  const [availableStrategies, setAvailableStrategies] = useState([]);
  const confidencePickerRef = useRef(null);
  const confidenceToggleRef = useRef(null);
  const gradePickerRef = useRef(null);
  const gradeToggleRef = useRef(null);
  const sessionPickerRef = useRef(null);
  const sessionToggleRef = useRef(null);
  const strategyPickerRef = useRef(null);
  const strategyToggleRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [triedRefresh, setTriedRefresh] = useState(false);

  const [fetchedTrade, setFetchedTrade] = useState(null);

  // Tags state
  const [allTags, setAllTags] = useState([]);
  const [editableTags, setEditableTags] = useState([]);

  const { authorizationToken, isPro } = useAuth();

  // helper to find trade by several possible id fields
  const findTradeById = (list, idParam) => {
    if (!Array.isArray(list)) return undefined;
    return list.find((t) => {
      const tId = t.id ?? t._id ?? t.tradeNumber;
      return String(tId) === String(idParam);
    });
  };

  const sessionLabels = {
    london: "London",
    newyork: "New York",
    asia: "Asian",
    sydney: "Sydney",
    tokyo: "Tokyo",
    european: "European",
  };

  const formatSessionLabel = (value) => {
    if (!value) return null;
    return sessionLabels[String(value).trim().toLowerCase()] || value;
  };

  const updateTradeMeta = async (payload) => {
    if (!authorizationToken) {
      throw new Error("You are not authenticated. Please log in.");
    }

    const response = await fetch(
      `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/trades/${trade._id || trade.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || "Failed to update trade details");
    }

    const updatedTrade = data?.trade || data;
    setFetchedTrade(updatedTrade);

    if (typeof refreshTrades === "function") {
      await refreshTrades();
    }

    return updatedTrade;
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

  useEffect(() => {
    const fetchStrategies = async () => {
      if (!authorizationToken) return;

      try {
        const response = await fetch(
          `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/strategy`,
          {
            headers: {
              Authorization: authorizationToken,
            },
          },
        );

        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setAvailableStrategies(data);
        }
      } catch (error) {
        console.error("Failed to load strategies", error);
      }
    };

    fetchStrategies();
  }, [authorizationToken]);

  // Close pickers when clicking outside any open picker or their toggles
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;

      if (isConfidencePickerOpen) {
        const inMenu = confidencePickerRef.current && confidencePickerRef.current.contains(t);
        const inToggle = confidenceToggleRef.current && confidenceToggleRef.current.contains(t);
        if (!inMenu && !inToggle) setIsConfidencePickerOpen(false);
      }

      if (isGradePickerOpen) {
        const inMenu = gradePickerRef.current && gradePickerRef.current.contains(t);
        const inToggle = gradeToggleRef.current && gradeToggleRef.current.contains(t);
        if (!inMenu && !inToggle) setIsGradePickerOpen(false);
      }

      if (isSessionPickerOpen) {
        const inMenu = sessionPickerRef.current && sessionPickerRef.current.contains(t);
        const inToggle = sessionToggleRef.current && sessionToggleRef.current.contains(t);
        if (!inMenu && !inToggle) setIsSessionPickerOpen(false);
      }

      if (isStrategyPickerOpen) {
        const inMenu = strategyPickerRef.current && strategyPickerRef.current.contains(t);
        const inToggle = strategyToggleRef.current && strategyToggleRef.current.contains(t);
        if (!inMenu && !inToggle) setIsStrategyPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isConfidencePickerOpen, isGradePickerOpen, isSessionPickerOpen, isStrategyPickerOpen]);

  // if trade is not in context, fetch it directly from backend by ID
  useEffect(() => {
    const fetchSingleTrade = async () => {
      if (!authorizationToken) return;

      try {
        setIsLoading(true);
        const res = await fetch(
          `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/trades/${id}`,
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

  if (isLoading && !trade) {
    return (
      <section className={`${styles.trade} app-page`}>
        <SkeletonText lines={1} width="220px" height={24} />
        <SkeletonCard rows={4} withHeader />
      </section>
    );
  }
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

      const netPnl = Number(updatedTrade.pnl || 0);
      const rr = Number(updatedTrade.rr || 0);
      const tradeResult = updatedTrade.tradeResult || "breakeven";
      const balanceAfterTrade = Number(
        updatedTrade.balanceAfterTrade ||
          accountDetails?.currentBalance + netPnl ||
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
        netPnl,
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
      navigate(`/app/trade/${id}`, { replace: true, state: historyState });
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
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/trades/${id}/note`,
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
        toastHelper.success("Note Updated");
      } else {
        toastHelper.error("Failed to update note");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Tag handlers
  const handleAddTags = async () => {
    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/tags`, {
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
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/trades/${trade._id}/tags`,
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

        toastHelper.success("Tags Updated");
      } else {
        toastHelper.error("Failed to update tags");
      }
    } catch (error) {
      console.error(error);
      toastHelper.error("Error updating tags");
    }
  };

  const onDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async (id) => {
    try {
      await deleteTradeByID(id, trade);
      navigate("/app/trade-history");
    } catch (error) {
      console.log(error);
    }
  };

  // Colors
  const pnlNumber = Number(trade?.pnl ?? 0);
  const pnlColor = Number.isFinite(pnlNumber)
    ? pnlNumber > 0
      ? "positive"
      : pnlNumber < 0
        ? "negative"
        : "neutral"
    : "neutral";
  const isLiveTrade = String(trade?.tradeStatus || "").toLowerCase() === "live";
  const resultValue = String(trade?.tradeResult || "").toLowerCase();
  const resultColor = isLiveTrade
    ? "neutral"
    : resultValue === "win"
      ? "positive"
      : resultValue === "loss"
        ? "negative"
        : "neutral";
  const resultToneClass = isLiveTrade ? styles.liveResult : styles[resultColor];
  const directionColor =
    trade.tradedirection?.toLowerCase() === "long" ? "long" : "short";
  const formatCurrency = (val) => {
    const n = Number(val || 0);
    if (!Number.isFinite(n)) return "$0.00";
    return n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `$${n.toFixed(2)}`;
  };

  const tradeGradeValue = (() => {
    const grade = String(trade?.tradeGrade || "").trim().toUpperCase();
    return ["C", "B", "B+", "A", "A+"].includes(grade) ? grade : null;
  })();
  const tradeGradeToneClass = (() => {
    if (!tradeGradeValue) return styles.gradePending;
    if (tradeGradeValue === "A" || tradeGradeValue === "A+") return styles.gradeA;
    if (tradeGradeValue === "B" || tradeGradeValue === "B+") return styles.gradeB;
    return styles.gradeC;
  })();
  const gradeOptions = ["C", "B", "B+", "A", "A+"];
  const rawTradeConfidence = trade?.tradeConfidence ?? trade?.confidence;
  const tradeConfidenceValue =
    rawTradeConfidence === null || rawTradeConfidence === undefined || rawTradeConfidence === ""
      ? null
      : Number.isFinite(Number(rawTradeConfidence))
        ? Math.max(0, Math.min(100, Number(rawTradeConfidence)))
        : null;
  const confidenceDraftValue = Number.isFinite(Number(confidenceDraft))
    ? Math.max(0, Math.min(100, Number(confidenceDraft)))
    : 50;
  const hasTradeConfidence = tradeConfidenceValue !== null;
  const tradeConfidenceLabel = hasTradeConfidence ? `${tradeConfidenceValue}%` : null;
  const tradeConfidenceToneClass = hasTradeConfidence ? styles.gradeA : styles.gradePending;

  const openConfidenceEditor = () => {
    setConfidenceDraft(tradeConfidenceValue ?? 50);
    setIsConfidencePickerOpen(true);
  };

  const handleGradeSelect = (selectedValue) => {
    setIsGradePickerOpen(false);
    updateTradeMeta({ tradeGrade: selectedValue || null })
      .then(() => toastHelper.success("Trade grade updated"))
      .catch((error) => {
        console.error("Failed to update trade grade", error);
        toastHelper.error(error.message || "Failed to update trade grade");
      });
  };

  const saveTradeConfidence = () => {
    const nextConfidence = confidenceDraftValue;
    setIsConfidencePickerOpen(false);
    updateTradeMeta({ tradeConfidence: nextConfidence, confidence: nextConfidence })
      .then(() => toastHelper.success("Trade confidence added"))
      .catch((error) => {
        console.error("Failed to update trade confidence", error);
        toastHelper.error(error.message || "Failed to update trade confidence");
      });
  };

  const sessionOptions = [
    { label: "London", value: "london" },
    { label: "New York", value: "newyork" },
    { label: "Asian", value: "asia" },
    { label: "Sydney", value: "sydney" },
    { label: "Tokyo", value: "tokyo" },
    { label: "European", value: "european" },
  ];

  const handleSessionSelect = (selectedValue) => {
    setIsSessionPickerOpen(false);
    updateTradeMeta({ session: selectedValue })
      .then(() => toastHelper.success("Session updated"))
      .catch((error) => {
        console.error("Failed to update session", error);
        toastHelper.error(error.message || "Failed to update session");
      });
  };

  const handleStrategySelect = (selectedValue) => {
    setIsStrategyPickerOpen(false);
    updateTradeMeta({ strategy: selectedValue || null })
      .then(() => toastHelper.success("Strategy updated"))
      .catch((error) => {
        console.error("Failed to update strategy", error);
        toastHelper.error(error.message || "Failed to update strategy");
      });
  };
  const tradeScreenshots = Array.isArray(trade.screenshots) ? trade.screenshots : [];
  const hasScreenshots = tradeScreenshots.length > 0;
  const screenshotUploadLimit = getMaxScreenshots(isPro);
  const entryTime = formatDateTimeUtc(trade.entryTime ?? trade.dateTime ?? trade.dateNtime);
  const exitTime = formatDateTimeUtc(trade.exitTime);
  const duration = formatDuration(trade);
  const sessionValue = formatSessionLabel(trade.session);
  const strategyValue =
    typeof trade.strategy === "object"
      ? trade.strategy?.name || "Strategy selected"
      : availableStrategies.find((option) => String(option._id) === String(trade.strategy))?.name ||
        (trade.strategy ? "Strategy selected" : null);
  const strategyDescription =
    typeof trade.strategy === "object"
      ? trade.strategy?.description || "No strategy description added."
      : null;

  const handleScreenshotSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > screenshotUploadLimit) {
      alert(`You can upload a maximum of ${screenshotUploadLimit} screenshots.`);
      event.target.value = "";
      return;
    }

    setSelectedScreenshots(files);
  };

  const cancelScreenshotSelection = () => {
    setSelectedScreenshots([]);
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = "";
    }
  };

  const uploadScreenshots = async () => {
    if (!trade?._id && !trade?.id) {
      alert("Trade not found.");
      return;
    }

    if (!selectedScreenshots.length) {
      alert("Please choose at least one screenshot.");
      return;
    }

    if (!authorizationToken) {
      alert("You are not authenticated. Please log in.");
      return;
    }

    setIsUploadingScreenshots(true);
    try {
      const formData = new FormData();
      selectedScreenshots.slice(0, screenshotUploadLimit).forEach((file) => {
        formData.append("screenshots", file);
      });

      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/trades/${trade._id || trade.id}/screenshots`,
        {
          method: "PATCH",
          headers: {
            Authorization: authorizationToken,
          },
          body: formData,
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update screenshots");
      }

      setFetchedTrade(data);
      setSelectedScreenshots([]);
      setActiveTab("screenshots");
      if (typeof refreshTrades === "function") {
        await refreshTrades();
      }
      toastHelper.success("Screenshots updated");
    } catch (error) {
      console.error(error);
      toastHelper.error(error.message || "Failed to upload screenshots");
    } finally {
      setIsUploadingScreenshots(false);
    }
  };

  const openSingleExitModal = () => {
    setExitLevels([{ price: "", volume: "100" }]);
    setIsMultipleTP(false);
    setCloseTrade(true);
  };

  return (
    <section className={styles.trade}>
      <div className={styles.tradeContainer}>
        <header className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() =>
              navigate(historyState.from || "/app/trade-history", {
                state:
                  typeof historyState.page === "number"
                    ? { page: historyState.page }
                    : undefined,
              })
            }
          >
            ← Back
          </button>
          <div className={styles.headerTitle}>
            <h2>
              Trade Details: <span>{trade.symbol}</span>
            </h2>
            <p>{formatDateTimeUtc(trade.entryTime ?? trade.dateTime ?? trade.dateNtime)}</p>
          </div>
          <div
            className={`${styles.marketType} ${trade.marketType?.toLowerCase()}`}
          >
            {trade.marketType || "—"}
          </div>
        </header>

        <div className={styles.viewTabs} role="tablist" aria-label="Trade detail views">
          <button
            type="button"
            className={`${styles.viewTabButton} ${activeTab === "chart" ? styles.viewTabButtonActive : ""}`}
            onClick={() => setActiveTab("chart")}
            aria-pressed={activeTab === "chart"}
          >
            Chart
          </button>
          <button
            type="button"
            className={`${styles.viewTabButton} ${activeTab === "screenshots" ? styles.viewTabButtonActive : ""}`}
            onClick={() => setActiveTab("screenshots")}
            aria-pressed={activeTab === "screenshots"}
          >
            Screenshots {hasScreenshots ? `(${tradeScreenshots.length})` : ""}
          </button>
        </div>

        <div className={styles.tabPanel}>
          {activeTab === "chart" ? (
            <TradeChart trade={trade} />
          ) : (
            <section className={styles.tradeScreenshot} aria-label="Trade screenshots">
              <div className={styles.screenshotToolbar}>
                <p>Trade screenshots</p>
                <div className={styles.screenshotUploadRow}>
                  {selectedScreenshots.length === 0 ? (
                    <label className={styles.screenshotUploadLabel} htmlFor="trade-screenshot-upload">
                      Add screenshot
                    </label>
                  ) : (
                    <button
                      type="button"
                      className={styles.screenshotCancelButton}
                      onClick={cancelScreenshotSelection}
                    >
                      Cancel
                    </button>
                  )}
                  <input
                    id="trade-screenshot-upload"
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotSelection}
                    className={styles.screenshotUploadInput}
                  />
                  {selectedScreenshots.length > 0 && (
                    <button
                      type="button"
                      className={styles.screenshotUploadButton}
                      onClick={uploadScreenshots}
                      disabled={isUploadingScreenshots}
                    >
                      {isUploadingScreenshots ? "Uploading..." : "Save"}
                    </button>
                  )}
                </div>
              </div>

              {selectedScreenshots.length > 0 && (
                <p className={styles.screenshotSelectionText}>
                  {selectedScreenshots.length}/{screenshotUploadLimit} selected
                </p>
              )}

              {hasScreenshots ? (
                <div className={styles.screenshotList}>
                  {tradeScreenshots.map((imageUrl, index) => (
                    <img
                      key={`${imageUrl}-${index}`}
                      src={imageUrl}
                      alt={`Trade screenshot ${index + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Screenshots</span>
                  <span className={styles.metricValue}>No screenshots added for this trade.</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Trade Info & Performance */}
        <div className={styles.tradeData}>
          <div className={styles.tradeInfo}>
            <h4>Trade Information</h4>
            <div className={styles.infoGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Direction</span>
                <span className={`${styles.metricValue} ${directionColor}`}>
                  {formatDirectionLabel(trade.tradeDirection)}
                </span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Market Type</span>
                <span className={styles.metricValue}>{trade.marketType || "—"}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Entry Price</span>
                <span className={styles.metricValue}>{trade.entryPrice}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Stop Loss</span>
                <span className={styles.metricValue}>{trade.stoplossPrice}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Take Profit</span>
                <span className={styles.metricValue}>{trade.takeProfitPrice}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Entry Time</span>
                <span className={styles.metricValue}>{entryTime}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Exit Time</span>
                <span className={styles.metricValue}>{exitTime}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Duration</span>
                <span className={styles.metricValue}>{duration}</span>
              </div>
            </div>
          </div>

          <div className={styles.tradePerformance}>
            <h4>Performance</h4>
            <div className={styles.performanceGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Risk Amount</span>
                <span className={styles.metricValue}>{formatCurrency(trade.riskAmount)}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Risk %</span>
                <span className={styles.metricValue}>{trade.riskPercent || 0}%</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>RR</span>
                <span className={styles.metricValue}>1:{trade.rr || 0}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>PnL</span>
                <span className={`${styles.metricValue} ${styles[pnlColor]}`}>{formatCurrency(trade.pnl)}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Balance After</span>
                <span className={styles.metricValue}>{formatCurrency(trade.balanceAfterTrade)}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Result</span>
                <span className={`${styles.metricValue} ${resultToneClass || ""}`}>
                  {isLiveTrade ? "- (live)" : trade.tradeResult || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.tradeConfidence}>
            <h4>Additional Info</h4>
            <div className={styles.additionalInfoGrid}>
              <div className={`${styles.metricCard} ${styles.confidenceMetricCard}`}>
                <span className={styles.metricLabel}>Trade Grade</span>
                {tradeGradeValue ? (
                  <div className={styles.confidencePickerWrap}>
                    <div className={styles.metaValueRow}>
                      <span className={`${styles.gradeBadge} ${tradeGradeToneClass}`}>
                        {tradeGradeValue}
                      </span>
                      <button
                        type="button"
                        className={`${styles.metaActionButton} ${styles.metaActionButtonMuted}`}
                        ref={gradeToggleRef}
                        onClick={() => setIsGradePickerOpen((open) => !open)}
                      >
                        Change
                      </button>
                    </div>
                    {isGradePickerOpen && (
                      <div className={styles.detailsPickerMenu} ref={gradePickerRef}>
                        {gradeOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={styles.detailsPickerItem}
                            onClick={() => handleGradeSelect(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.confidencePickerWrap}>
                    <button
                      type="button"
                      className={styles.confidenceSetButton}
                      ref={gradeToggleRef}
                      onClick={() => setIsGradePickerOpen((open) => !open)}
                    >
                      + Set Grade
                    </button>
                    {isGradePickerOpen && (
                      <div className={styles.detailsPickerMenu} ref={gradePickerRef}>
                        {gradeOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={styles.detailsPickerItem}
                            onClick={() => handleGradeSelect(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={`${styles.metricCard} ${styles.metaActionCard}`}>
                <span className={styles.metricLabel}>Session</span>
                {sessionValue ? (
                  <div className={`${styles.metaValueRow} ${styles.metaValueRowSpread}`}>
                    <span className={styles.metricValue}>{sessionValue}</span>
                    <button
                      type="button"
                      className={`${styles.metaActionButton} ${styles.metaActionButtonMuted}`}
                      ref={sessionToggleRef}
                      onClick={() => setIsSessionPickerOpen((open) => !open)}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className={styles.detailsPickerWrap}>
                    <button
                      type="button"
                      className={styles.confidenceSetButton}
                        ref={sessionToggleRef}
                        onClick={() => setIsSessionPickerOpen((open) => !open)}
                    >
                      + Set Session
                    </button>
                  </div>
                )}
                {isSessionPickerOpen && (
                  <div className={styles.detailsPickerMenu} ref={sessionPickerRef}>
                    {sessionOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={styles.detailsPickerItem}
                        onClick={() => handleSessionSelect(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={`${styles.metricCard} ${styles.confidenceMetricCard}`}>
                <span className={styles.metricLabel}>Trade Confidence</span>
                {hasTradeConfidence ? (
                  <div className={styles.gradeWrap}>
                    <span className={`${styles.gradeBadge} ${tradeConfidenceToneClass}`}>
                      {tradeConfidenceLabel}
                    </span>
                  </div>
                ) : isConfidencePickerOpen ? (
                  <div className={styles.confidencePickerWrap} ref={confidencePickerRef}>
                    <div className={styles.confidenceMeta}>{confidenceDraftValue}%</div>
                    <div className={styles.confidenceTrack} style={{ "--confidence": `${confidenceDraftValue}%` }}>
                      <div className={styles.confidenceTrackFill} />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={confidenceDraftValue}
                        onChange={(e) => setConfidenceDraft(Number(e.target.value))}
                        aria-label="Trade confidence"
                      />
                    </div>
                    <div className={styles.confidenceMarks} aria-hidden>
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                    <button
                      type="button"
                      className={styles.confidenceSetButton}
                      onClick={saveTradeConfidence}
                    >
                      Save Confidence
                    </button>
                  </div>
                ) : (
                  <div className={styles.confidencePickerWrap}>
                    <button
                      type="button"
                      className={styles.confidenceSetButton}
                      ref={confidenceToggleRef}
                      onClick={openConfidenceEditor}
                    >
                      + Set Trade Confidence
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Status</span>
                <span
                  className={`${styles.metricValue} ${
                    String(trade.tradeStatus || "").toLowerCase() === "live"
                      ? styles.statusLive
                      : styles.statusExited
                  }`}
                >
                  {String(trade.tradeStatus || "").toLowerCase() === "live"
                    ? "Live"
                    : String(trade.tradeStatus || "").toLowerCase() === "exited"
                      ? "Exited"
                      : String(trade.tradeStatus || "").toLowerCase() === "missed"
                        ? "Missed"
                        : trade.tradeStatus || "—"}
                </span>
              </div>
          
            </div>
            {/* confidence progress bar removed in favor of grade badge */}
          </div>

          <div className={styles.exitPrice}>
            <h4>Exit Prices</h4>
            {isLiveTrade ? (
              <div className={styles.exitLiveState}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Status</span>
                  <span className={styles.metricValue}>Trade is live — add exit prices</span>
                </div>
                <div className={styles.exitActionRow}>
                  <button type="button" className={styles.exitActionButton} onClick={openSingleExitModal}>
                    Add Exit Price
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.exitList}>
                <div className={styles.exitHeaderRow}>
                  <span className={styles.exitHeaderCell}>Target</span>
                  <span className={styles.exitHeaderCell}>Price</span>
                  <span className={`${styles.exitHeaderCell} ${styles.exitHeaderRight}`}>Volume</span>
                  <span className={`${styles.exitHeaderCell} ${styles.exitHeaderRight}`}>Executed Time</span>
                </div>
                {Array.isArray(trade.exitedPrice) && trade.exitedPrice.map((exitedPrice, index) => {
                  const exitTimestamp = trade.exitTimestamps?.[index]?.timestamp;
                  const formattedExitTimestamp = exitTimestamp
                    ? formatDateTimeUtc(exitTimestamp)
                    : exitTime;
                  const hasExecutedTimestamp = Boolean(exitTimestamp || (formattedExitTimestamp && formattedExitTimestamp !== "—"));

                  return (
                    <div key={index} className={styles.exitRow}>
                      <div className={styles.exitTarget}>Exit {index + 1}</div>
                      <div className={styles.exitPriceValue}>{exitedPrice.price}</div>
                      <div className={styles.exitVolumeValue}>{exitedPrice.volume}%</div>
                      <div className={hasExecutedTimestamp ? styles.exitTimeValue : styles.exitTimePending}>
                        {hasExecutedTimestamp ? formattedExitTimestamp : "Pending / Manual"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Strategy Display */}
        <div className={styles.tradeStrategy}>
          <div className={styles.notesHeader}>
            <h4>Strategy</h4>
            <button
              type="button"
              className={styles.notebtn}
              ref={strategyToggleRef}
              onClick={() => setIsStrategyPickerOpen((open) => !open)}
            >
              {trade.strategy ? "Change" : "Set Strategy"}
            </button>
          </div>

          <div className={styles.strategyPickerWrap}>
            {isStrategyPickerOpen && (
              <div className={styles.detailsPickerMenu} ref={strategyPickerRef}>
                {availableStrategies.length > 0 ? (
                  availableStrategies.map((option) => (
                    <button
                      key={option._id}
                      type="button"
                      className={styles.detailsPickerItem}
                      onClick={() => handleStrategySelect(option._id)}
                    >
                      {option.name}
                    </button>
                  ))
                ) : (
                  <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Strategy</span>
                    <span className={styles.metricValue}>No strategies available. Create one first.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {trade.strategy && (
            <div className={styles.strategyGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Strategy Name</span>
                <span className={styles.metricValue}>
                  {typeof trade.strategy === 'object' ? trade.strategy.name : strategyValue || 'Strategy Selected'}
                </span>
              </div>

              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Strategy Type</span>
                <span className={styles.metricValue}>
                  {typeof trade.strategy === 'object'
                    ? (trade.strategy.type || trade.strategy.category || 'Custom')
                    : 'Selected'}
                </span>
              </div>

              <div className={styles.strategyDescriptionCard}>
                <div className={styles.strategyIcon}>📊</div>
                <div className={styles.strategyInfo}>
                  <span className={styles.metricLabel}>Notes</span>
                  <p className={styles.strategyDescription}>
                    {typeof trade.strategy === 'object' && trade.strategy.description
                      ? trade.strategy.description
                      : 'No strategy description added.'}
                  </p>
                </div>
              </div>
            </div>
          )}
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
              <div className={styles.tagsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Total Tags</span>
                  <span className={styles.metricValue}>{trade.tags.length}</span>
                </div>
                <div className={styles.tagsListCard}>
                  {trade.tags.map((tag) => (
                    <span
                      key={tag._id}
                      className={`${styles.tagBadge} ${tag.name && tag.name.length === 1 ? styles.tagInitial : ""}`}
                      style={{ backgroundColor: tag.colour }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Tags</span>
                <span className={styles.metricValue}>No tags added</span>
              </div>
            )
          ) : (
            <div className={styles.tagPickerCard}>
              {allTags.length === 0 ? (
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Tag Editor</span>
                  <span className={styles.metricValue}>No tags available. Create tags in the Tags page.</span>
                </div>
              ) : (
                <div className={styles.tagPicker}>
                  {allTags.map((t) => {
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
                  })}
                </div>
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

import styles from "./addtrade.module.css";
import { TradeSetup } from "./TradeSetup";
import { TradeStatus } from "./TradeStatus";
import { AddPrice } from "./AddPrice";
import { TradeInfo } from "./TradeInfo";
import { TradeCalculator } from "./TradeCalculator";
import { useContext, useState } from "react";
import { calculateTradeValues } from "../../../utils/tradeUtils";
import { useAuth } from "../../../store/Auth";
import { useTrades } from "../../../store/TradeContext";
import { toastHelper } from "../../../utils/toastHelper";
import { AccountContext } from "../../../context/AccountContext";

const createInitialTrade = () => ({
  id: "",
  tradeMode: "live",
  marketType: "",
  symbol: "",
  tradedirection: "",
  entryPrice: "",
  stoplossPrice: "",
  riskType: "",
  takeProfitPrice: "",
  showCosts: false,
  slippage: "",
  commission: "",
  entryTime: "",
  tradeStatus: "live",
  exitedPrice: [],
  rr: "",
  pnl: "",
  tradeResult: "",
  riskamount: "",
  riskPercent: "",
  balanceAfterTrade: "",
  tradeNumber: "",
  dateNtime: "",
  tradeNotes: "",
  session: "",
  tradeGrade: "",
  tradeConfidence: "",
  tags: [],
  strategy: "",
});

export const AddTrade = () => {
  const { authorizationToken } = useAuth();
  const { AddTrade: addTradeFromContext } = useTrades();
  const { accountDetails } = useContext(AccountContext);

  const [trade, setTrade] = useState(createInitialTrade);
  const [screenshots, setScreenshots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTrade((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const accountId = accountDetails?._id;
    if (!accountId) {
      alert("Please select an account before adding a trade.");
      return;
    }

    if (!authorizationToken || !authorizationToken.startsWith("Bearer ")) {
      alert("You are not authenticated. Please log in.");
      return;
    }

    const totalVolume = Array.isArray(trade.exitedPrice)
      ? trade.exitedPrice.reduce((sum, lvl) => sum + Number(lvl.volume || 0), 0)
      : 0;

    if (trade.tradeStatus === "exited" && totalVolume !== 100) {
      alert("Total exit volume must equal 100%");
      return;
    }

    const prevBalance = Number(accountDetails?.currentBalance || 0);
    const prevTotalTrades = Number(accountDetails?.totalTrades || 0);
    const entrySource = trade.entryTime || trade.tradeDate || new Date();
    const entryDate = new Date(entrySource);
    const now = new Date();
    if (entryDate.getTime() > now.getTime()) {
      alert("Entry time cannot be in the future.");
      return;
    }

    const entryIso = Number.isNaN(entryDate.getTime())
      ? new Date().toISOString()
      : entryDate.toISOString();

    const { pnl: netPnl, rr, riskamount } = calculateTradeValues({
      trade,
      accountBalance: prevBalance,
    });

    let tradeResult = "breakeven";
    if (netPnl > 0) tradeResult = "win";
    else if (netPnl < 0) tradeResult = "loss";

    const riskPercent =
      riskamount && prevBalance
        ? Number(((riskamount / prevBalance) * 100).toFixed(2))
        : 0;

    const normalizedExits = Array.isArray(trade.exitedPrice)
      ? trade.exitedPrice
          .map((ep) => {
            const price = Number(ep.price);
            const volume = Number(ep.volume);
            const timestamp = ep.timestamp ? new Date(ep.timestamp) : new Date(entryIso);
            if (Number.isNaN(price) || Number.isNaN(volume)) return null;
            if (Number.isNaN(timestamp.getTime())) return null;
            return { price, volume, timestamp: timestamp.toISOString() };
          })
          .filter(Boolean)
      : [];

    const invalidExitTime = normalizedExits.some(
      (exit) => new Date(exit.timestamp).getTime() < entryDate.getTime(),
    );

    if (invalidExitTime) {
      alert("Exit time cannot be earlier than entry time.");
      return;
    }

    const normalizedDirection = (trade.tradedirection || "")
      .toString()
      .trim()
      .toLowerCase();
    const normalizedStatus = (trade.tradeStatus || "")
      .toString()
      .trim()
      .toLowerCase();
    const isMissedTrade = normalizedStatus === "missed";
    const normalizedTradeMode = String(trade.tradeMode || "live")
      .trim()
      .toLowerCase();
    const isCapitalTrade = !isMissedTrade && normalizedTradeMode !== "backtest";

    const effectivePnl = Number(netPnl || 0);
    const effectiveTradeResult = isMissedTrade ? "missed" : tradeResult;
    const effectiveBalanceAfterTrade = isCapitalTrade
      ? Number(Math.round((prevBalance + effectivePnl) * 100) / 100)
      : prevBalance;

    const confidenceStateValue = trade.tradeConfidence;
    const isConfidenceSet =
      confidenceStateValue !== "" &&
      confidenceStateValue !== null &&
      confidenceStateValue !== undefined;
    const normalizedConfidence = isConfidenceSet
      ? Number(confidenceStateValue)
      : null;

    const normalizedTrade = {
      marketType: (trade.marketType || "").toString(),
      symbol: (trade.symbol || "").toString(),
      tradeDirection: normalizedDirection,
      entryPrice: Number(trade.entryPrice || 0),
      stoplossPrice: Number(trade.stoplossPrice || 0),
      takeProfitPrice:
        trade.takeProfitPrice === "" || trade.takeProfitPrice == null
          ? undefined
          : Number(trade.takeProfitPrice),
      slippage: trade.showCosts ? Number(trade.slippage || 0) : 0,
      commission: trade.showCosts ? Number(trade.commission || 0) : 0,
      riskType: (trade.riskType || "").toString(),
      exitedPrice: normalizedExits,
      rr: Number(rr || 0),
      pnl: Number(effectivePnl || 0),
      tradeResult: effectiveTradeResult,
      tradeMode: normalizedTradeMode,
      riskAmount: Number(
        riskamount ?? trade.riskamount ?? trade.riskAmount ?? 0,
      ),
      riskPercent: Number(riskPercent || 0),
      balanceAfterTrade: Number(effectiveBalanceAfterTrade),
      tradeNumber: Number(prevTotalTrades + 1),
      dateTime: entryIso,
      entryTime: entryIso,
      exitTime:
        trade.tradeStatus === "exited" && normalizedExits.length > 0
          ? new Date(
              normalizedExits.reduce((latest, exit) => {
                const current = new Date(exit.timestamp).getTime();
                return current > latest ? current : latest;
              }, 0),
            ).toISOString()
          : undefined,
      exitTimestamps: trade.tradeStatus === "exited" ? normalizedExits : [],
      tradeNotes: trade.tradeNotes || "",
      tradeStatus: normalizedStatus,
      session: (trade.session || "").toString().trim().toLowerCase(),
      accountId,
      tags: trade.tags || [],
      strategy: trade.strategy || undefined,
      tradeGrade: (trade.tradeGrade || "").toString().trim().toUpperCase(),
      tradeConfidence: normalizedConfidence,
      confidence: normalizedConfidence,
    };

    if (
      !isConfidenceSet ||
      normalizedTrade.confidence === "" ||
      normalizedTrade.confidence === null ||
      normalizedTrade.confidence === undefined ||
      Number.isNaN(normalizedTrade.confidence)
    ) {
      normalizedTrade.tradeConfidence = null;
      normalizedTrade.confidence = null;
    }

    console.log("🔍 [DEBUG] RAW CONFIDENCE STATE VALUE:", confidenceStateValue, typeof confidenceStateValue);
    console.log("🚨 [DEBUG] FULL TRADE SUBMISSION PAYLOAD:", normalizedTrade);
    console.log("💾 [DEBUG] POST-CLEANUP PAYLOAD CONFIDENCE BEING SENT TO DB:", normalizedTrade.confidence);

    if (
      !normalizedTrade.marketType ||
      !normalizedTrade.symbol ||
      !normalizedTrade.tradeDirection
    ) {
      alert("Please fill market type, symbol and trade direction.");
      return;
    }

    if (
      normalizedTrade.entryPrice === 0 ||
      Number.isNaN(normalizedTrade.entryPrice) ||
      normalizedTrade.stoplossPrice === 0 ||
      Number.isNaN(normalizedTrade.stoplossPrice)
    ) {
      alert("Entry price and stoploss price must be valid numbers.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addTradeFromContext(normalizedTrade, screenshots);
    } catch {
      toastHelper.error("Failed to add trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`${styles.addtrade} app-page`}>
      <form onSubmit={handleSubmit}>
        <PageHeading />

        <div className={styles.addtradeGrid}>
          <div className={styles.leftColumn}>
            <TradeSetup trade={trade} handleChange={handleChange} />
            <AddPrice trade={trade} handleChange={handleChange} />
            <TradeStatus
              trade={trade}
              handleChange={handleChange}
              onExitChange={(levels) =>
                setTrade((prev) => ({ ...prev, exitedPrice: levels }))
              }
            />
            <div className={styles.summarySection}>
              <TradeCalculator trade={trade} setTrade={setTrade} />
            </div>
            <TradeInfo
              trade={trade}
              handleChange={handleChange}
              screenshots={screenshots}
              setScreenshots={setScreenshots}
            />
          </div>
        </div>

        <div className={styles.formFooter}>
          <Buttons setTrade={setTrade} isSubmitting={isSubmitting} />
        </div>
      </form>
    </section>
  );
};

const PageHeading = () => (
  <div className={`${styles.heading} app-page-heading`}>
    <h2 className={`${styles.title} app-page-title`}>
      Add <span>Trade</span>
    </h2>
    <p className="app-page-subtitle">
      Fill in the details below to log a new trade to your journal.
    </p>
  </div>
);

const Buttons = ({ setTrade, isSubmitting }) => (
  <div className={styles.btncontainer}>
    <button
      type="reset"
      disabled={isSubmitting}
      onClick={() => setTrade(createInitialTrade())}
    >
      Clear All
    </button>
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Adding..." : "Add Trade"}
    </button>
  </div>
);

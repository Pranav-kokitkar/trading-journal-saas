import styles from "./addtrade.module.css";
import { TradeStatus } from "./TradeStatus";
import { TradeDetails } from "./TradeDetails";
import { AddPrice } from "./AddPrice";
import { TradeInfo } from "./TradeInfo";
import { TradeCalculator } from "./TradeCalculator";
import { useContext, useState } from "react";
import { UserContext } from "../../../context/UserContext";
import { calculateTradeValues } from "../../../utils/tradeUtils";
import { useAuth } from "../../../store/Auth";
import { useTrades } from "../../../store/TradeContext";
import { PerformanceContext } from "../../../context/PerformanceContext";
import { toast } from "react-toastify";
import { AccountContext } from "../../../context/AccountContext";

export const AddTrade = () => {
  const { authorizationToken } = useAuth();
  const { AddTrade: addTradeFromContext } = useTrades();

  const { accountDetails } = useContext(AccountContext);

  const [trade, setTrade] = useState({
    id: "",
    marketType: "",
    symbol: "EUR/USD",
    tradedirection: "",
    entryPrice: "1.33179",
    stoplossPrice: "1.33120",
    riskType: "",
    takeProfitPrice: "1.33319",
    tradeStatus: "live",
    exitedPrice: [{ price: "", volume: "" }],
    rr: "",
    pnl: "",
    tradeResult: "",
    riskamount: "",
    riskPercent: "",
    balanceAfterTrade: "",
    tradeNumber: "",
    dateNtime: "",
    tradeNotes: "",
  });

  // ✅ NEW: hold up to 2 screenshot files selected in the UI
  const [screenshots, setScreenshots] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    // Protect against accountDetails missing
    const prevBalance = Number(accountDetails?.currentBalance || 0);
    const prevTotalTrades = Number(accountDetails?.totalTrades || 0);

    const { pnl, rr, riskamount } = calculateTradeValues({
      trade,
      accountBalance: prevBalance,
    });

    let tradeResult = "breakeven";
    if (pnl > 0) tradeResult = "win";
    else if (pnl < 0) tradeResult = "loss";

    const isoDate = new Date().toISOString();

    const tradeNumber = prevTotalTrades + 1;
    const balanceAfterTrade = Number(
      Math.round((prevBalance + pnl) * 100) / 100
    );
    const riskPercent =
      riskamount && prevBalance
        ? Number(((riskamount / prevBalance) * 100).toFixed(2))
        : 0;

    const normalizedExits = Array.isArray(trade.exitedPrice)
      ? trade.exitedPrice
          .map((ep) => {
            const price = Number(ep.price);
            const volume = Number(ep.volume);
            if (Number.isNaN(price) || Number.isNaN(volume)) return null;
            return { price, volume };
          })
          .filter(Boolean)
      : [];

    const normalizedDirection = (trade.tradedirection || "")
      .toString()
      .trim()
      .toLowerCase();
    const normalizedStatus = (trade.tradeStatus || "")
      .toString()
      .trim()
      .toLowerCase();

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
      riskType: (trade.riskType || "").toString(),
      exitedPrice: normalizedExits,
      rr: Number(rr || 0),
      pnl: Number(pnl || 0),
      tradeResult,
      riskAmount: Number(
        riskamount ?? trade.riskamount ?? trade.riskAmount ?? 0
      ),
      riskPercent: Number(riskPercent || 0),
      balanceAfterTrade: Number(balanceAfterTrade),
      tradeNumber: Number(tradeNumber),
      dateTime: isoDate,
      tradeNotes: trade.tradeNotes || "",
      tradeStatus: normalizedStatus,
      accountId,
    };

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
      await addTradeFromContext(normalizedTrade, screenshots);
    } catch (err) {
      toast.error("Failed to add trade", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }
  };

  return (
    <section className={styles.addtrade}>
      <form onSubmit={handleSubmit}>
        <PageHeading />
        <TradeDetails trade={trade} handleChange={handleChange} />
        <AddPrice trade={trade} handleChange={handleChange} />
        <TradeStatus
          trade={trade}
          handleChange={handleChange}
          onExitChange={(levels) =>
            setTrade((prev) => ({ ...prev, exitedPrice: levels }))
          }
        />
        <TradeCalculator trade={trade} setTrade={setTrade} />
        {/* ✅ now passes screenshot state + setter down */}
        <TradeInfo
          trade={trade}
          handleChange={handleChange}
          screenshots={screenshots}
          setScreenshots={setScreenshots}
        />
        <Buttons setTrade={setTrade} />
      </form>
    </section>
  );
};

const PageHeading = () => (
  <div className={styles.heading}>
    <h2 className={styles.title}>
              Add <span>Trade</span>
            </h2>
    <p>Fill this to add new trade to your journal</p>
  </div>
);

const Buttons = ({ setTrade }) => (
  <div className={styles.btncontainer}>
    <button
      type="reset"
      onClick={() =>
        setTrade({
          id: "",
          marketType: "",
          symbol: "",
          tradedirection: "",
          entryPrice: "",
          stoplossPrice: "",
          riskType: "",
          takeProfitPrice: "",
          tradeStatus: "",
          exitedPrice: [{ price: "", volume: "" }],
          rr: "",
          pnl: "",
          tradeResult: "",
          riskamount: "",
          dateNtime: "",
          tradeNotes: "",
        })
      }
    >
      Clear All
    </button>
    <button type="submit">Add Trade</button>
  </div>
);

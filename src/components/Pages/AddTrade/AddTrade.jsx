import styles from "./addtrade.module.css";
import { TradeStatus } from "./TradeStatus";
import { TradeDetails } from "./TradeDetails";
import { AddPrice } from "./AddPrice";
import { TradeInfo } from "./TradeInfo";
import { TradeCalculator } from "./TradeCalculator";
import { useContext, useState } from "react";
import { AccountContext } from "../../../context/AccountContext";
import { PerformanceContext } from "../../../context/PerformanceContext";
import { calculateTradeValues } from "../../../utils/tradeUtils";
import { useAuth } from "../../../store/Auth";

export const AddTrade = () => {
  const { accountDetails, setAccountDetails } = useContext(AccountContext);
  const { refreshPerformance } = useContext(PerformanceContext);
  const { authorizationToken } = useAuth();

  const [trade, setTrade] = useState({
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
    riskPercent: "",
    balanceAfterTrade: "",
    tradeNumber: "",
    dateNtime: "",
    tradeNotes: "",
  });

  // handleChange (you already had this in previous versions)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1) Basic validation: ensure auth header available
    if (!authorizationToken || !authorizationToken.startsWith("Bearer ")) {
      alert("You are not authenticated. Please log in.");
      return;
    }

    // 2) Validate exit volume first (sum of volumes should be 100 when exited)
    const totalVolume = Array.isArray(trade.exitedPrice)
      ? trade.exitedPrice.reduce((sum, lvl) => sum + Number(lvl.volume || 0), 0)
      : 0;
    if (trade.tradeStatus === "exited" && totalVolume !== 100) {
      alert("Total exit volume must equal 100%");
      return;
    }

    // 3) Compute derived numeric values using your util
    const { pnl, rr, riskamount } = calculateTradeValues({
      trade,
      accountBalance: accountDetails.balance,
    });

    // 4) Determine tradeResult
    let tradeResult = "breakeven";
    if (pnl > 0) tradeResult = "win";
    else if (pnl < 0) tradeResult = "loss";

    // 5) Prepare derived values
    const isoDate = new Date().toISOString();

    const tradeNumber =
      typeof accountDetails.totaltrades === "number"
        ? accountDetails.totaltrades + 1
        : 1;

    const balanceAfterTrade = Number(
      Math.round((accountDetails.balance + pnl) * 100) / 100
    );

    const riskPercent =
      riskamount && accountDetails.balance
        ? Number(((riskamount / accountDetails.balance) * 100).toFixed(2))
        : 0;

    // 6) Normalize exitedPrice entries to numbers and drop invalid entries
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

    // 7) Normalize enums/strings: keep them lowercase for consistency
    const normalizedDirection = (
      trade.tradedirection ||
      trade.tradeDirection ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    const normalizedStatus = (trade.tradeStatus || "")
      .toString()
      .trim()
      .toLowerCase();

    // 8) Build the final normalized trade object to send to server
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
      dateTime: isoDate, // use client ISO timestamp for the trade event
      tradeNotes: trade.tradeNotes || "",
      tradeStatus: normalizedStatus,
    };

    // Extra validation before sending
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

    // 9) Send to server
    try {
      const response = await fetch("http://localhost:3000/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(normalizedTrade),
      });

      // parse response body safely
      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        // ignore parse error; some responses may not contain JSON
      }

      if (response.ok) {
        console.log("trade added to db", data);

        // 10) Update account and UI only after success
        setAccountDetails((prev) => ({
          ...prev,
          balance: normalizedTrade.balanceAfterTrade,
          totaltrades: (prev.totaltrades || 0) + 1,
        }));

        // refresh performance (assumes this reads from server or recomputes locally)
        refreshPerformance();

        // Reset form
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
          riskPercent: "",
          balanceAfterTrade: "",
          tradeNumber: "",
          dateNtime: "",
          tradeNotes: "",
        });

        alert("Trade added successfully");
      } else {
        console.warn("Failed to add trade. Server response:", data);
        // Show helpful message from server if available
        const message =
          data?.message || "Failed to add trade — check console for details";
        alert(message);
      }
    } catch (error) {
      console.error("add trade to db error", error);
      alert("Network or unexpected error — see console");
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
        <TradeInfo trade={trade} handleChange={handleChange} />
        <Buttons setTrade={setTrade} />
      </form>
    </section>
  );
};

const PageHeading = () => (
  <div className={styles.heading}>
    <h3>Add New Trade</h3>
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

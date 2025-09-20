import { v4 as uuidv4 } from "uuid";
import styles from "./addtrade.module.css";
import { TradeStatus } from "./TradeStatus";
import { TradeDetails } from "./TradeDetails";
import { AddPrice } from "./AddPrice";
import { TradeInfo } from "./TradeInfo";
import { TradeCalculator } from "./TradeCalculator"; 
import {  useContext, useState } from "react";
import { AccountContext } from "../../../context/AccountContext";

export const AddTrade = () => {

  const {accountDetails, setAccountDetails} =useContext(AccountContext);

  const [trade, setTrade] = useState({
    id: "",
    marketType: "",
    symbol: "",
    tradedirection: "",
    entryPrice: "114600.2",
    stoplossPrice: "114542.4",
    riskType: "dollar",
    takeProfitPrice: "114773.7",
    tradeStatus: "",
    exitedPrice: [{ price: "", volume: "" }],
    rr: "",
    pnl: "",
    tradeResult: "",
    riskamount: "",
    riskPercent: "", // NEW
    balanceAfterTrade: "", // NEW
    tradeNumber: "", // NEW
    dateNtime: "",
    tradeNotes: "",
  });


  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const existingTrades = JSON.parse(localStorage.getItem("trades") || "[]");

    const tradeId = uuidv4();
    const dateNtime = new Date().toLocaleString();

    // Calculate trade result
    let tradeResult = "breakeven";
    if (trade.pnl > 0) tradeResult = "win";
    else if (trade.pnl < 0) tradeResult = "loss";

    // Calculate trade number
    const tradeNumber = existingTrades.length + 1;

    // Calculate balance after trade
    const balanceAfterTrade =
      accountDetails.balance + Math.round(trade.pnl * 100) / 100;

    // Calculate risk percent (simple version)
    const riskPercent =
      trade.riskamount && accountDetails.balance
        ? ((trade.riskamount / accountDetails.balance) * 100).toFixed(2)
        : 0;

    const newTrade = {
      ...trade,
      id: tradeId,
      dateNtime,
      tradeResult,
      tradeNumber,
      balanceAfterTrade,
      riskPercent,
    };

    const updatedTrades = [...existingTrades, newTrade];
    localStorage.setItem("trades", JSON.stringify(updatedTrades));

    // Update account balance + stats
    setAccountDetails((prev) => ({
      ...prev,
      balance: balanceAfterTrade,
      totaltrades: prev.totaltrades + 1,
    }));

    console.log("Trade saved:", newTrade);

    // Validation for exit volume
    const totalVolume = trade.exitedPrice.reduce(
      (sum, lvl) => sum + Number(lvl.volume || 0),
      0
    );
    if (trade.tradeStatus === "exited" && totalVolume !== 100) {
      alert("Total exit volume must equal 100%");
      return;
    }

    // Reset form
    setTrade({
      id: "",
      marketType: "",
      symbol: "",
      tradedirection: "",
      entryPrice: "114600.2",
      stoplossPrice: "114542.4",
      riskType: "dollar",
      takeProfitPrice: "114773.7",
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

const Buttons = ({ setTrade }) => {
  return (
    <div className={styles.btncontainer}>
      <button
        type="reset"
        onClick={() =>
          setTrade({
            id: "",
            marketType: "",
            symbol: "",
            tradedirection: "",
            entryPrice: "114600.2",
            stoplossPrice: "114542.4",
            riskType: "dollar",
            takeProfitPrice: "114773.7",
            tradeStatus: "",
            exitedPrice: [{ price: "", volume: "" }],
            rr: "",
            pnl: "",
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
};
import { useState } from "react";
import styles from "./addtrade.module.css";
import { TradeHistory } from "../TradeHistory/TradeHistory";
import { TradeStatus } from "./TradeStatus";
import { TradeDetails } from "./TradeDetails";
import { AddPrice } from "./AddPrice";
import { TradeInfo } from "./TradeInfo";
import { TradeCalculator } from "./TradeCalculator"; 

export const AddTrade = () => {
  const [trade, setTrade] = useState({
    marketType: "",
    symbol: "",
    tradedirection: "",
    entryPrice: "114600.2",
    stoplossPrice: "114542.4",
    takeProfitPrice: "114773.7",
    exitedPrice: [{ price: "", volume: "" }],
    riskAmount: "10",
    tradeStatus: "",
    tradeNotes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalVolume = trade.exitedPrice.reduce(
      (sum, lvl) => sum + Number(lvl.volume || 0),
      0
    );

    if (trade.tradeStatus === "exited" && totalVolume !== 100) {
      alert("Total exit volume must equal 100%");
      return;
    }
    console.log("Trade submitted:", trade);
    setTrade({
      marketType: "",
      symbol: "",
      tradedirection: "",
      entryPrice: "",
      stoplossPrice: "",
      takeProfitPrice: "",
      riskAmount: "",
      tradeStatus: "",
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
        <TradeCalculator trade={trade} />
        <TradeInfo trade={trade} handleChange={handleChange} />
        <Buttons />
      </form>
      <TradeHistory />
    </section>
  );
};

const PageHeading = () => (
  <div className={styles.heading}>
    <h3>Add New Trade</h3>
    <p>Fill this to add new trade to your journal</p>
  </div>
);

const Buttons = (setTrade) => {
  return (
    <div className={styles.btncontainer}>
      <button
        type="reset"
        onClick={() =>
          setTrade({
            marketType: "",
            symbol: "",
            tradedirection: "",
            entryPrice: "",
            stoplossPrice: "",
            takeProfitPrice: "",
            riskAmount: "",
            tradeStatus: "",
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
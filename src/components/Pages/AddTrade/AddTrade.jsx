import { v4 as uuidv4 } from "uuid";
import styles from "./addtrade.module.css";
import { TradeStatus } from "./TradeStatus";
import { TradeDetails } from "./TradeDetails";
import { AddPrice } from "./AddPrice";
import { TradeInfo } from "./TradeInfo";
import { TradeCalculator } from "./TradeCalculator"; 

export const AddTrade = () => {
  const [trade, setTrade] = useState({
    id: "",
    marketType: "",
    symbol: "",
    tradedirection: "",
    entryPrice: "114600.2",
    stoplossPrice: "114542.4",
    takeProfitPrice: "114773.7",
    exitedPrice: [{ price: "", volume: "" }],
    riskAmount: "10",
    tradeStatus: "",
    rr: "",
    profit: "",
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

    // Create unique ID and date/time
    const tradeId = uuidv4();
    const dateNtime = new Date().toLocaleString();

    // Build new trade object with all fields
    const newTrade = { ...trade, id: tradeId, dateNtime };

    const updatedTrades = [...existingTrades, newTrade];
    localStorage.setItem("trades", JSON.stringify(updatedTrades));

    console.log("Trade saved:", newTrade);


    const totalVolume = trade.exitedPrice.reduce(
      (sum, lvl) => sum + Number(lvl.volume || 0),
      0
    );

    if (trade.tradeStatus === "exited" && totalVolume !== 100) {
      alert("Total exit volume must equal 100%");
      return;
    }
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
      <button type="submit">
        Add Trade
      </button>
    </div>
  );
};
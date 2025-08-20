import { useState } from "react";
import styles from "../styles/addtrade.module.css";
import { TradeHistory } from "./TradeHistory";
import { TradeStatus } from "./AddTrade/TradeStatus";

export const AddTrade = () => {
  const [trade, setTrade] = useState({
    marketType: "",
    symbol: "",
    tradedirection: "",
    entryPrice: "",
    stoplossPrice: "",
    takeProfitPrice: "",
    exitedPrice:[
      {price: "", volume:"" }
    ],
    riskAmount: "",
    tradeStatus: "",
    tradeNotes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
        <Enterprice trade={trade} handleChange={handleChange} />
        <TradeCalculator />
        <TradeStatus trade={trade} handleChange={handleChange} />
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

const TradeDetails = ({ trade, handleChange }) => (
  <div className={styles.card}>
    <h3>Trade Details</h3>

    <div className={styles.row}>
      <div className={styles.inputGroup}>
        <label htmlFor="marketType">Market Type</label>
        <select
          id="marketType"
          name="marketType"
          value={trade.marketType}
          onChange={handleChange}
          required
        >
          <option value="">Select</option>
          <option value="forex">Forex</option>
          <option value="crypto">Crypto</option>
          <option value="options">Options</option>
        </select>
      </div>
      <InputField
        label="Symbol Name:"
        type="text"
        placeholder="pair name"
        name="symbol"
        value={trade.symbol}
        onChange={handleChange}
        required={true}
      />
    </div>

    <div className={styles.tradedirection}>
      <label>Trade Direction</label>
      <div className={styles.radioContainer}>
        <div>
          <input
            type="radio"
            id="long"
            name="tradedirection"
            value="long"
            checked={trade.tradedirection === "long"}
            onChange={handleChange}
            required
          />
          <label htmlFor="long">Long</label>
        </div>
        <div>
          <input
            type="radio"
            id="short"
            name="tradedirection"
            value="short"
            checked={trade.tradedirection === "short"}
            onChange={handleChange}
            required
          />
          <label htmlFor="short">Short</label>
        </div>
      </div>
    </div>
  </div>
);

const Enterprice = ({ trade, handleChange }) => (
  <div className={styles.card}>
    <h3>Price & Risk Management</h3>

    <div className={styles.row}>
      <InputField
        label="Entry:"
        type="number"
        placeholder="Enter entry price"
        name="entryPrice"
        value={trade.entryPrice}
        onChange={handleChange}
        required={true}
      />
      <InputField
        label="Stoploss:"
        type="number"
        placeholder="Enter stoploss"
        name="stoplossPrice"
        value={trade.stoplossPrice}
        onChange={handleChange}
        required={true}
      />
    </div>

    <div className={styles.row}>
      <InputField
        label="Take Profit:"
        type="number"
        placeholder="Enter TP price"
        name="takeProfitPrice"
        value={trade.takeProfitPrice}
        onChange={handleChange}
        required={true}
      />
      <InputField
        label="Risk Amount:"
        type="number"
        placeholder="Enter risk amount"
        name="riskAmount"
        value={trade.riskAmount}
        onChange={handleChange}
        required={true}
      />
    </div>
  </div>
);

const TradeCalculator = () => (
  <div className={styles.card}>
    <h3>Trade Calculator</h3>

    <div className={styles.row3}>
      <div className={styles.col2}>
        <p>
          Stop Distance: <span>9.9 pips</span>
        </p>
        <p>
          Potential Loss: <span>$99</span>
        </p>
      </div>

      <div className={styles.col2}>
        <p>
          Lot Size: <span>9.9</span>
        </p>
        <p>
          Potential Profit: <span>$999</span>
        </p>
      </div>

      <div className={styles.col2}>
        <p>
          Pip value: <span>$9.99/pip</span>
        </p>
      </div>
    </div>
  </div>
);


const TradeInfo = ({ trade, handleChange }) => (
  <div className={styles.card}>
    <h3>Additional Info</h3>
    <div className={styles.col2}>
      <InputField label="Upload Screenshot" type="file" required={false} />
    </div>
    <div className={styles.col2}>
      <label htmlFor="tradeNotes">Notes and Description</label>
      <textarea
        id="tradeNotes"
        name="tradeNotes"
        value={trade.tradeNotes}
        onChange={handleChange}
        placeholder="Add your trade analysis, strategy or any additional notes..."
      />
    </div>
  </div>
);

const Buttons = (setTrade) => (
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

const InputField = ({
  label,
  type,
  placeholder,
  name,
  value,
  onChange,
  required,
}) => (
  <div className={styles.inputGroup}>
    <label htmlFor={name}>{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      value={type === "file" ? undefined : value} // avoid controlled warning for file
      onChange={(e) => {
        if (type === "file") {
          onChange({ target: { name, value: e.target.files[0] } });
        } else {
          onChange(e);
        }
      }}
      required={required}
    />
  </div>
);

import styles from "./TradeHistory.module.css";

export const TradeHistory = () => {

  
  const savedTrade = JSON.parse(localStorage.getItem("trades") || "[]");


  const handleClear = () => {
    localStorage.clear(); // or localStorage.removeItem("keyName")
    alert("LocalStorage cleared!");
  };
  
  return (
    <section id="tarde-history" className={styles.tardehistory}>
      <div>
        <h3>Trade History</h3>
        <p>Review and analyze all your trades here</p>
      </div>
      <div className={styles.filter}>
        <h3>Filter & Search</h3>

        <div className={styles.filterinput}>
          <input type="text" placeholder="search for symbol.."></input>
          <select id="marketType">
            <option value="">All Market</option>
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="options">Options</option>
          </select>
          <select id="status">
            <option value="">All Status</option>
            <option value="forex">Live</option>
            <option value="crypto">Exited</option>
          </select>
          <select id="result">
            <option value="">All Result</option>
            <option value="forex">Win</option>
            <option value="crypto">Loss</option>
          </select>
        </div>

        <div className={styles.filter3}>
          <p>Showing 1 of 1 trade</p>
          <button onClick={handleClear}>Clear Filter</button>
        </div>
      </div>

      <TradeCard savedTrade={savedTrade}/>
    </section>
  );
};

const TradeCard = ({savedTrade}) => {
  if (!savedTrade || savedTrade.length === 0) return <p>No trades yet</p>;
  return (
    <>
      {savedTrade.map((tradeData, index) => (
        <div key={index} className={styles.tradecard}>
          <div>LOGO</div>
          <div className={styles.symbol}>
            <div>{tradeData.marketType}</div>
            <div className={styles.belowsymbol}>
              <p>{tradeData.dateNtime}</p>
            </div>
          </div>
          <div className={styles.tradequickdata}>
            <div>
              <p>Trade Direction:</p>
              <p>{tradeData.tradedirection}</p>
            </div>
            <div>
              <p>RR:</p>
              <p>
                1:<span>{tradeData.rr || "0"}</span>
              </p>
            </div>
            <div>
              <p>Win</p>
              <p>{tradeData.profit || "0"}</p>
            </div>
          </div>
        </div>
      ))}
      ;
    </>
  );
};

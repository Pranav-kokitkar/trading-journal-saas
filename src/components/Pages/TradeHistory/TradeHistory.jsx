import { NavLink } from "react-router-dom";
import styles from "./TradeHistory.module.css";

export const TradeHistory = () => {
  const savedTrade = JSON.parse(localStorage.getItem("trades") || "[]");

  const handleClear = () => {
    localStorage.removeItem("trades");
    alert("Trade history cleared!");
    window.location.reload(); // refresh to update UI
  };

  return (
    <section id="trade-history" className={styles.tardehistory}>
      <div className={styles.tradehistorycontainer}>
        <div className={styles.heading}>
          <h3>Trade History</h3>
          <p>Review and analyze all your trades here</p>
        </div>

        <div className={styles.filter}>
          <h3>Filter & Search</h3>

          <div className={styles.filterinput}>
            <input type="text" placeholder="Search symbol..." />
            <select id="marketType">
              <option value="">All Market</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
              <option value="stocks">Stocks</option>
            </select>
            <select id="status">
              <option value="">All Status</option>
              <option value="live">Live</option>
              <option value="exited">Exited</option>
            </select>
            <select id="result">
              <option value="">All Result</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
          </div>

          <div className={styles.filter3}>
            <p>Showing {savedTrade.length} trades</p>
            <button onClick={handleClear}>Clear All</button>
          </div>
        </div>
        <TradeCard savedTrade={savedTrade} />
      </div>
    </section>
  );
};

const TradeCard = ({ savedTrade }) => {
  if (!savedTrade || savedTrade.length === 0)
    return <p className={styles.notrades}>No trades yet</p>;

  return (
    <>
      {savedTrade.map((tradeData, index) => (
        <NavLink
          key={index}
          to={`/trade/${tradeData.id}`}
        >
          <div className={styles.tradecard}>
            <div className={styles.logo}>📈</div>

            <div className={styles.symbol}>
              <div>{tradeData.symbol || tradeData.marketType}</div>
              <div className={styles.belowsymbol}>
                <p>{tradeData.marketType}</p>
                <p>{tradeData.dateNtime}</p>
              </div>
            </div>

            <div className={styles.tradequickdata}>
              <div>
                <p>Direction</p>
                <span>{tradeData.tradedirection}</span>
              </div>
              <div>
                <p>RR</p>
                <span>1:{tradeData.rr || "0"}</span>
              </div>
              <div>
                <p>Profit</p>
                <span>{tradeData.profit || "0"}</span>
              </div>
            </div>
          </div>
        </NavLink>
      ))}
    </>
  );
};

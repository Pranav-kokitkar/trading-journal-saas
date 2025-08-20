import styles from "../styles/tradehistory.module.css";

export const TradeHistory = () => {
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
            <button>Clear Filter</button>
        </div>

      </div>

        <TradeCard/>
    </section>
  );
};

const TradeCard =()=>{
    return(
        <div className={styles.tradecard}>
            <div>LOGO</div>
            <div className={styles.symbol}>
                <div>EUR/USD</div>
                <div className={styles.belowsymbol}>
                    <p>market</p>
                    <p>jul 08, 2025 18:50</p>
                </div>
            </div>
            <div className={styles.tradequickdata}>
                <div>
                    <p>Trade Direction:</p>
                    <p>long</p>
                </div>
                <div>
                    <p>RR:</p>
                    <p>1:10</p>
                </div>
                <div>
                    <p>Win</p>
                    <p>$99</p>
                </div>
            </div>
        </div>
    )
}

import styles from "./Trade.module.css"

export const Trade =()=>{
    return (
      <section className={styles.trade}>
        <div className={styles.tradecontainer}>
          <div>
            <h2>Trade Details:</h2>
            <p>12-09-2025 14:13</p>
          </div>
          <div className={styles.tradedata}>
            <div className={styles.tradeinfo}>
              <h4>trade Information</h4>
              <p>market Type :</p>
              <p>Direction:</p>
              <p>Entry Price :</p>
              <p>Stoploss :</p>
              <p>Takeprofit:</p>
            </div>
            <div className={styles.tradeperformance}>
              <h4>Performance</h4>
              <p>Risk Amount:</p>
              <p>RR:</p>
              <p>Potential Loss:</p>
              <p>Potential Profit:</p>
            </div>
            <div className={styles.exitprice}>
              <p>price: , volume:</p>
              <p> price: , volume:</p>
              {/* this will be dyanamic depending upon how much exit price user have added if one it will only show one  */}
            </div>
          </div>
          <div className={styles.tradedescription}></div>
          <div className={styles.tradescreenshot}></div>
          <div className={styles.tradebtns}>
            <button className={styles.edittrade}>Edit Trade</button>
            <button className={styles.closetrade}>Close Trade </button>
            {/* close tarde only shows if the trade is on going */}
            <button className={styles.deletetrade}>Delete Trade</button>
          </div>
        </div>
      </section>
    );
}
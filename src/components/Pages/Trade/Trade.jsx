import { useParams, useNavigate } from "react-router-dom";
import styles from "./Trade.module.css"
import { useState } from "react";

export const Trade =()=>{

  const {id} = useParams();
  const navigate = useNavigate();
  const trades =JSON.parse(localStorage.getItem("trades")) || [];
  const trade = trades.find(t=>t.id === id);

  const handleDelete = () => {
    let trades = JSON.parse(localStorage.getItem("trades")) || [];

    const updatedTrades = trades.filter((t) => String(t.id) !== String(id));

    localStorage.setItem("trades", JSON.stringify(updatedTrades));
    navigate("/trade-history");
  };


  if(!trade){
    return <p>Trade not found</p>
  }

    return (
      <section className={styles.trade}>
        <div className={styles.tradecontainer}>
          <div>
            <h2>Trade Details:</h2>
            <p>{trade.dateNtime}</p>
          </div>
          <div className={styles.tradedata}>
            <div className={styles.tradeinfo}>
              <h4>Trade Information</h4>
              <p>
                Market Type : <span>{trade.marketType}</span>
              </p>
              <p>
                Direction : <span>{trade.tradedirection}</span>
              </p>
              <p>
                Entry Price : <span>{trade.entryPrice}</span>
              </p>
              <p>
                Stop Loss : <span>{trade.stoplossPrice}</span>
              </p>
              <p>
                Take Profit: <span>{trade.takeProfitPrice}</span>
              </p>
            </div>
            <div className={styles.tradeperformance}>
              <h4>Performance</h4>
              <p>
                Risk Amount: <span>${trade.riskamount}</span>
              </p>
              <p>
                RR : 1:<span>{trade.rr}</span>
              </p>
              <p>
                PNL : <span>${trade.pnl}</span>
              </p>
            </div>
            <div className={styles.exitprice}>
              {trade.exitedPrice.map((exitedPrice, index) => (
                <div className={styles.exitpricedata}>
                  <p>
                    Exit Price {index + 1} : <span>{exitedPrice.price}</span>
                  </p>
                  <p>
                    Volume : <span>{exitedPrice.volume}%</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.tradedescription}>
            <span>{trade.tradeNotes}</span>
          </div>
          <div className={styles.tradescreenshot}></div>
          <div className={styles.tradebtns}>
            <button className={styles.edittrade}>Edit Trade</button>
            <button className={styles.closetrade}>Close Trade </button>
            {/* close tarde only shows if the trade is on going */}
            <button className={styles.deletetrade} onClick={handleDelete}>Delete Trade</button>
          </div>
        </div>
      </section>
    );
}
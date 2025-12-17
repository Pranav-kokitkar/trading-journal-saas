import { useEffect, useState } from "react"
import { useAuth } from "../../../store/Auth";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./AdminAccountDetails.module.css"
import { AdminAccountEditModal } from "./AdminAccountEditModal";

export const AdminAccountDetails = ()=>{

    const [accountDetails, setAccountDetails] = useState(null);
    const [trades, setTrades] = useState([])
    const [loading, setLoading] = useState(true);
    const {id} = useParams();
    const [showModal, setShowModal]= useState(false);

    const {authorizationToken} = useAuth();
    const navigate = useNavigate();

    const getAccount = async()=>{
        try {
            setLoading(true);
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/account/${id}`,{
                method:"GET",
                headers:{
                    Authorization:authorizationToken
                }
            });
            const res_data = await response.json();
            if(response.ok){
                setAccountDetails(res_data);
            }else{
                console.log("failed to get account details")
            }
        } catch (error) {
            console.log(error)
        }finally{
            setLoading(false);
        }
    }


    const getTradesByAccountID= async()=>{
        try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/account/${id}/trades`,{
            method:"GET",
            headers:{
                Authorization:authorizationToken
            }
        });
        const res_data= await response.json();
        if(response.ok){
            setTrades(res_data);
            console.log(res_data);
        }
        } catch (error) {
        console.log(error);
        }finally{
        }
    }

    const EditAccount = async(details)=>{
      try {
        const updatedDetails = details
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/account/${id}`,{
          method:"PATCH",
          headers:{
            "Content-Type": "application/json",
            Authorization:authorizationToken
          },
          body: JSON.stringify(details),
        });
        if(response.ok){
          console.log("account details updated");
          setShowModal(false);
          getAccount();
        }else{
          console.log("failed to update account deatils")
        }
      } catch (error) {
        console.log(error);
      }
    }


    useEffect(()=>{
        if(authorizationToken){
            getAccount();
            getTradesByAccountID();
        }
    },[authorizationToken]);

    if(loading){
        return <p>Loading....</p>
    }

    return (
    <section className={styles.page}>
      {showModal && !loading && (<AdminAccountEditModal EditAccount={EditAccount} onClose={()=>setShowModal(false)} name={accountDetails.name} status={accountDetails.status}/>)}
        {/* Header */}
        <div className={styles.header}>
  <div className={styles.leftActions}>
    <button
      className={styles.backBtn}
      onClick={() => navigate(-1)}
    >
      ← Back
    </button>
  </div>

  <div className={styles.center}>
    <h2 className={styles.accountName}>{accountDetails.name}</h2>
    <span className={`${styles.status} ${styles[accountDetails.status]}`}>
      {accountDetails.status}
    </span>
  </div>

  <div className={styles.rightActions}>
    <button
      className={styles.editBtn}
      onClick={() => setShowModal(true)}
    >
      Edit
    </button>
  </div>
</div>


        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
            <span>Initial Capital</span>
            <h3>${accountDetails.initialCapital}</h3>
        </div>

        <div className={styles.summaryCard}>
            <span>Current Balance</span>
            <h3>${accountDetails.currentBalance}</h3>
        </div>

        <div className={styles.summaryCard}>
            <span>Total Trades</span>
            <h3>{accountDetails.totalTrades}</h3>
        </div>

        <div className={styles.summaryCard}>
            <span>Created On</span>
            <h3>
            {new Date(accountDetails.createdAt).toLocaleDateString()}
            </h3>
        </div>
        </div>

        {/* Trades Section Placeholder */}
        <div className={styles.tradesSection}>
            <h3 className={styles.sectionTitle}>Trades</h3>
            {trades && trades.length === 0 ? (
            <p className={styles.placeholder}>No trades found for this account</p>
            ) : (
            <DisplayTrades trades={trades} />
            )}
        </div>
    </section>
    );
}

const DisplayTrades = ({ trades }) => {
  return (
    <div className={styles.tradesGrid}>
      {trades.map((t) => (
        <div key={t._id || t.tradeNumber} className={styles.tradeCard}>
          {/* Header */}
          <div className={styles.tradeHeader}>
            <div>
              <h4 className={styles.symbol}>{t.symbol}</h4>
              <span className={styles.direction}>
                {t.tradeDirection.toUpperCase()}
              </span>
            </div>

            <span
              className={`${styles.result} ${
                t.tradeResult === "win"
                  ? styles.win
                  : t.tradeResult === "loss"
                  ? styles.loss
                  : styles.be
              }`}
            >
              {t.tradeResult}
            </span>
          </div>

          {/* Prices */}
          <div className={styles.priceRow}>
            <span>Entry</span>
            <span>{t.entryPrice}</span>
          </div>

          <div className={styles.priceRow}>
            <span>SL</span>
            <span>{t.stoplossPrice}</span>
          </div>

          <div className={styles.priceRow}>
            <span>TP</span>
            <span>{t.takeProfitPrice}</span>
          </div>

          {/* Metrics */}
          <div className={styles.metrics}>
            <div>
              <span>PnL</span>
              <strong
                className={t.pnl >= 0 ? styles.pnlPositive : styles.pnlNegative}
              >
                ${t.pnl}
              </strong>
            </div>

            <div>
              <span>RR</span>
              <strong>{t.rr}</strong>
            </div>

            <div>
              <span>Risk</span>
              <strong>
                ${t.riskAmount} ({t.riskPercent}%)
              </strong>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.tradeFooter}>
            <span>Trade #{t.tradeNumber}</span>
            <span>
              {new Date(t.dateTime).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};


import { useContext, useEffect, useState } from "react";
import { AccountContext } from "../../../context/AccountContext";
import { useAuth } from "../../../store/Auth";
import styles from "./myaccount.module.css";
import { useNavigate } from "react-router-dom";

export const MyAccount = () => {
  const { accountDetails, setAccountDetails } = useContext(AccountContext);
  const [darkTheme, setDarkTheme] = useState(true);
  
  const {logoutUser} = useAuth();
  // Local state just for input field
  const [tempCapital, setTempCapital] = useState(accountDetails.initialCapital);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setTempCapital(Number(e.target.value)); // only update local input state
  };

  const changeAccountBalance = () => {
    setAccountDetails((prev) => ({
      ...prev,
      initialCapital: tempCapital,
      balance: tempCapital, // reset balance only when saved
    }));

    localStorage.setItem(
      "accountDetails",
      JSON.stringify({
        ...accountDetails,
        initialCapital: tempCapital,
        balance: tempCapital,
      })
    );

    alert("Account updated ✅");
  };

  const handleReset=()=>{
    localStorage.removeItem("trades");
    localStorage.removeItem("accountDetails");
    alert("Account has been Reset!");
    window.location.reload(); // refresh to update UI
  }

  const handleLogout = () => {
      logoutUser();

    navigate("/");
  };

  return (
    <section className={styles.myaccount}>
      <div className={styles.myaccountpageheading}>
        <h2>My Account</h2>
        <p>Manage your account and data</p>
      </div>

      {/* ✅ Account Overview */}
      <div className={styles.accountdatacontainer}>
        <h3>Account Overview</h3>
        <div className={styles.accountdata}>
          <div className={styles.accountbox}>
            <p>Initial Capital</p>
            <h3>${accountDetails.initialCapital}</h3>
          </div>
          <div className={styles.accountbox}>
            <p>Current Balance</p>
            <h3>${accountDetails.balance}</h3>
          </div>
          <div className={styles.accountbox}>
            <p>Total Trades</p>
            <h3>{accountDetails.totaltrades}</h3>
          </div>
        </div>
      </div>

      {/* ✅ Update Capital */}
      <div className={styles.updatecapitalcontainer}>
        <h3>Update Capital</h3>
        <div className={styles.inlineform}>
          <input
            type="number"
            placeholder="Enter Initial Capital"
            name="initialCapital"
            value={tempCapital || ""}
            onChange={handleInputChange}
          />
          <button onClick={changeAccountBalance}>Save</button>
        </div>
        <p className={styles.warning}>
          ⚠ Updating capital will reset your current balance to the new amount.
          This will not affect your trading history.
        </p>
      </div>

      {/* ✅ Export Data */}
      <div className={styles.sectionbox}>
        <h3>Export Trading Data</h3>
        <p>
          Download your complete trading journal with all trades and account
          information.
        </p>
        <div className={styles.btngroup}>
          <button>Export as CSV</button>
          <button>Export as JSON</button>
        </div>
      </div>

      {/* ✅ Appearance */}
      <div className={styles.sectionbox}>
        <h3>Appearance</h3>
        <div className={styles.togglecontainer}>
          <p>Dark Theme</p>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={darkTheme}
              onChange={() => setDarkTheme(!darkTheme)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      {/* ✅ Danger Zone */}
      <div className={`${styles.sectionbox} ${styles.dangerzone}`}>
        <h3>Danger Zone</h3>
        <h4>Reset All Data</h4>
        <p>
          This will permanently delete all your trades and reset your account
          balance to initial capital. <b>This action cannot be undone.</b>
        </p>
        <button className={styles.dangerbtn} onClick={handleReset}>
          Reset All Data
        </button>
      </div>

      <div className={styles.sectionbox}>
        <button className={styles.dangerbtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ✅ Help & About */}
      <div className={styles.sectionbox}>
        <h3>Help & About</h3>
        <p>Learn more about using this trading journal.</p>
      </div>
    </section>
  );
};

// src/components/.../MyAccount.jsx
import { useContext, useEffect, useState } from "react";
import { AccountContext } from "../../../context/AccountContext";
import { useAuth } from "../../../store/Auth";
import styles from "./myaccount.module.css";
import { useNavigate } from "react-router-dom";

export const MyAccount = () => {
  const { accountDetails, setAccountDetails, updateAccount, getAccount } =
    useContext(AccountContext);
  const [darkTheme, setDarkTheme] = useState(true);

  const { logoutUser } = useAuth();

  // Initialize tempCapital from accountDetails when it becomes available
  const [tempCapital, setTempCapital] = useState("");

  useEffect(() => {
    if (
      accountDetails &&
      typeof accountDetails.initialCapital !== "undefined"
    ) {
      setTempCapital(Number(accountDetails.initialCapital));
    }
  }, [accountDetails]);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setTempCapital(e.target.value === "" ? "" : Number(e.target.value)); // local numeric state or empty
  };

  const changeAccountBalance = async () => {
    // ensure we have accountDetails
    if (!accountDetails) {
      alert("Account not loaded yet. Try again in a moment.");
      return;
    }

    // validate input
    const newInitial = Number(tempCapital);
    if (Number.isNaN(newInitial) || newInitial < 0) {
      alert("Please enter a valid non-negative number for initial capital.");
      return;
    }

    if (
      !window.confirm(
        `Save new initial capital of $${newInitial}? This will set current balance to $${newInitial}.`
      )
    ) {
      return;
    }

    const prevBalance = Number(accountDetails.balance ?? 0);
    const pnlDelta = Number(newInitial) - prevBalance; // amount to add/subtract to current balance

    try {
      // Persist balance change to backend by sending pnl delta
      // updateAccount accepts either a number or { pnl: number } per your contract
      await updateAccount(pnlDelta);

      // Now update initialCapital locally (backend doesn't expose an endpoint for initialCapital)
      const updated = {
        ...accountDetails,
        initialCapital: newInitial,
        balance: Number(prevBalance + pnlDelta), // should equal newInitial
      };
      setAccountDetails(updated);

      // Persist local snapshot in localStorage for reload behavior
      localStorage.setItem("accountDetails", JSON.stringify(updated));

      alert("Account updated ✅");
    } catch (err) {
      console.error("Failed to update account balance:", err);
      alert(
        "Failed to update account on server. Check console and try again. No local changes were saved."
      );
    }
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "Are you sure? This will remove local trades and account snapshot from this browser."
      )
    )
      return;

    localStorage.removeItem("trades");
    localStorage.removeItem("accountDetails");

    // Clear local account state and re-fetch from server (if available)
    setAccountDetails(undefined);
    try {
      // try to re-fetch from server if getAccount is available
      if (typeof getAccount === "function") getAccount();
    } catch (e) {
      // ignore
    }

    alert("Account has been Reset!");
    // update UI
    window.location.reload();
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/app/dashboard");
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
            <h3>${accountDetails?.initialCapital ?? "—"}</h3>
          </div>
          <div className={styles.accountbox}>
            <p>Current Balance</p>
            <h3>${accountDetails?.balance ?? "—"}</h3>
          </div>
          <div className={styles.accountbox}>
            <p>Total Trades</p>
            <h3>
              {accountDetails?.totalTrades ?? accountDetails?.totaltrades ?? 0}
            </h3>
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
            value={tempCapital === "" ? "" : tempCapital}
            onChange={handleInputChange}
            min="0"
          />
          <button
            onClick={changeAccountBalance}
            disabled={tempCapital === "" || Number.isNaN(Number(tempCapital))}
          >
            Save
          </button>
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

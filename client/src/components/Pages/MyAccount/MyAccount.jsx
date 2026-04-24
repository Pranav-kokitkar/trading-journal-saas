import { useContext, useEffect, useState } from "react";
import { useAuth } from "../../../store/Auth";
import styles from "./myaccount.module.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext";
import { AccountContext } from "../../../context/AccountContext";
import { SelectAccount } from "./SelectAccount";
import { CreateAccModal } from "../../modals/CreateAccModal/CreateAccModal";
import { exportTrades } from "../../../services/exportService";
import { ConfirmationModal } from "../../modals/ConfirmationModal/ConfirmationModal";
import { ImportTrades } from "./ImportTrades";

export const MyAccount = () => {
  const { getUser } = useContext(UserContext);
  const [darkTheme, setDarkTheme] = useState(true);
  const { logoutUser, authorizationToken } = useAuth();
  const { accounts, accountDetails } =
    useContext(AccountContext);
  const [IsCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleReset = () => {
    console.log("will add soon")
  };

  const confirmLogout =() => {
    try {
      logoutUser();
      navigate("/app/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  const createAcc = () => {
    setIsCreateModalOpen(true);
  };

  const handleExport = async (format) => {
    try {
      await exportTrades(format);
    } catch (error) {
      alert("Failed to export trades");
    }
  };

  return (
    <section className={`${styles.myaccount} app-page`}>
      {IsCreateModalOpen && (
        <CreateAccModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      <div className={styles.mainContent}>
        {/* Page Heading - Consistent with other pages */}
        <div className={`${styles.myaccountpageheading} app-page-heading`}>
          <h2 className="app-page-title">
            My <span>Account</span>
          </h2>
          <p className="app-page-subtitle">Manage your trading accounts, preferences, and data</p>
        </div>

        {/* Account Selector */}
        <SelectAccount accounts={accounts} createAcc={createAcc} />

        {/* Account Overview */}
        <div className={styles.accountdatacontainer}>
          <h3>Account Overview</h3>
          <div className={styles.accountdata}>
            <div className={styles.accountbox}>
              <p>Initial Capital</p>
              <h3>
                {accountDetails && accounts.length > 0
                  ? `$${Number(accountDetails.initialCapital).toFixed(2)}`
                  : "—"}
              </h3>
            </div>
            <div className={styles.accountbox}>
              <p>Current Balance</p>
              <h3>
                {accountDetails && accounts.length > 0
                  ? `$${Number(accountDetails.currentBalance).toFixed(2)}`
                  : "—"}
              </h3>
            </div>
            <div className={styles.accountbox}>
              <p>Total Trades</p>
              <h3>
                {accountDetails && accounts.length > 0
                  ? accountDetails.totalTrades ??
                    accountDetails.totaltrades ??
                    0
                  : "—"}
              </h3>
            </div>
          </div>
        </div>

        {/* Import & Export Data */}
        <div className={styles.actionRow}>
          <div className={styles.sectionbox}>
            <h3>Import Trading Data</h3>
            <p>
              Upload CSV or JSON trades to add them to your selected account.
            </p>
            <div className={styles.btngroup}>
              <button onClick={() => setIsImportModalOpen(true)}>
                Import Trades
              </button>
            </div>
          </div>

          <div className={styles.sectionbox}>
            <h3>Export Trading Data</h3>
            <p>
              Download your complete trading journal with all trades and account
              information.
            </p>
            <div className={styles.btngroup}>
              <button onClick={() => handleExport("csv")}>Export as CSV</button>
              <button onClick={() => handleExport("json")}>Export as JSON</button>
            </div>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className={styles.sectionbox}>
          <h3>Theme Preferences</h3>
          <p>Customize your interface appearance</p>
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

        {/* Danger Zone */}
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

        {/* Logout */}
        <div className={styles.sectionbox}>
          <h3>Log Out</h3>
          <p>Log out of your account on this device.</p>
          <button className={styles.dangerbtn} onClick={()=>setIsLogoutModalOpen(true)}>
            Logout
          </button>
        </div>

        {/* Help & About */}
        <div className={styles.sectionbox}>
          <h3>About</h3>
          <p>
            Kyros Journal helps you eliminate weak trades, identify your strongest setups, and build a consistent trading edge through data.
          </p>
        </div>
      </div>
      <ConfirmationModal
              isOpen={isLogoutModalOpen}
              title="Logout from app"
              message="arey you sure you want to perfom this action ?"
              confirmText="Logout"
              cancelText="Cancel"
              onCancel={() => setIsLogoutModalOpen(false)}
              onConfirm={confirmLogout}
            />

      <ImportTrades
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        accountId={accountDetails?._id}
        authorizationToken={authorizationToken}
      />
    </section>
  );
};

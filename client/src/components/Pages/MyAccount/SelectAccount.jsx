import { useContext, useState, useEffect } from "react";
import { AccountContext } from "../../../context/AccountContext";
import { UserContext } from "../../../context/UserContext";
import { useAuth } from "../../../store/Auth";
import styles from "./selectaccount.module.css";

export const SelectAccount = ({ accounts, createAcc }) => {
  const { authorizationToken, user, userAuthentication } = useAuth();
  const { getUser } = useContext(UserContext);
  const {
    getActiveAccount,
    accountDetails,
    accounts: accountList, // if you need context accounts later
  } = useContext(AccountContext);

  const [selectedId, setSelectedId] = useState("");
  const [currAccName, setCurrAccName] = useState("");

  // Helper: get account name from a given accountId using the `accounts` prop
  const getAccountName = (activeAccountId) => {
    if (!activeAccountId || !accounts || accounts.length === 0) return;

    const activeAccount = accounts.find((acc) => acc._id === activeAccountId);

    const activeAccountName = activeAccount
      ? activeAccount.name
      : "Account not found";

    setCurrAccName(activeAccountName);
  };

  // Initialize current account name and selected option when user / accounts change
  useEffect(() => {
    if (user?.activeAccountId && accounts?.length) {
      setSelectedId(user.activeAccountId);
      getAccountName(user.activeAccountId);
    }
  }, [user?.activeAccountId, accounts]);

  const handleChange = async (e) => {
    const activeAccountId = e.target.value;
    setSelectedId(activeAccountId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/active-account`,
        {
          method: "PATCH",
          headers: {
            Authorization: authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activeAccountId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Refresh user/account data in context
        getUser();
        getActiveAccount();
        userAuthentication();

        // Immediately update UI name from local accounts list
        getAccountName(activeAccountId);

        console.log(accountDetails);
      } else {
        console.log("Failed to update", data);
      }
    } catch (error) {
      console.log("error while changing account:", error);
    }
  };

  return (
    <div className={styles.selectaccountcontainer}>
      <div className={styles.currentacc}>
        <h3>Current Account:</h3>
        <p className={styles.name}>{currAccName || "No active account"}</p>
      </div>

      <label>Change Account</label>
      <select value={selectedId} onChange={handleChange}>
        <option value="" disabled>
          Select an account
        </option>
        {accounts.map((acc) => (
          <option key={acc._id} value={acc._id}>
            {acc.name}
          </option>
        ))}
      </select>

      <div className={styles.createAcccontainer}>
        <button className={styles.createAccBtn} onClick={createAcc}>
          Create New Account
        </button>
      </div>
    </div>
  );
};

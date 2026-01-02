import { useContext, useState, useEffect } from "react";
import { AccountContext } from "../../../context/AccountContext";
import { UserContext } from "../../../context/UserContext";
import { useAuth } from "../../../store/Auth";
import styles from "./selectaccount.module.css";

export const SelectAccount = ({ accounts, createAcc }) => {
  const { authorizationToken, userAuthentication } = useAuth();
  const { getUser, userDetails } = useContext(UserContext);
  const { getActiveAccount, deleteAccount, getAllAccounts } =
    useContext(AccountContext);

  const [selectedId, setSelectedId] = useState("");
  const [currAccName, setCurrAccName] = useState("");

  // ✅ SINGLE source of truth for name
  useEffect(() => {
     if (!userDetails?.activeAccountId || !accounts?.length) {
       setCurrAccName("");
       setSelectedId("");
       return;
     }

     const activeAccount = accounts.find(
       (acc) => acc._id === userDetails.activeAccountId
     );

    if (activeAccount) {
      setCurrAccName(activeAccount.name);
      setSelectedId(activeAccount._id);
    } else {
      setCurrAccName("");
    }
  }, [userDetails?.activeAccountId, accounts]);

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

      if (response.ok) {
        await Promise.all([
          getUser(),
          getAllAccounts(),
          getActiveAccount(),
          userAuthentication(),
        ]);
      }
    } catch (error) {
      console.log("error while changing account:", error);
    }
  };

  const onDelete = async () => {
    const confirmed = window.confirm(
      "Deleting an account will also lead to delete trades taken from this account. also it cant be undone"
    );

    if (!confirmed) return;

    await deleteAccount();
  };

  return (
    <div className={styles.selectaccountcontainer}>
      <div className={styles.currentacc}>
        <h3>Current Account:</h3>
        <p className={styles.name}>{currAccName || "No active account"}</p>
      </div>

      <label>Change Account</label>
      <select
        value={selectedId}
        onChange={handleChange}
        disabled={accounts.length === 0}
      >
        <option value="" disabled>
          {accounts.length === 0
            ? "Create an account first"
            : "Select an account"}
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
      {accounts.length > 0 && (
        <div>
          <button className={styles.dangerbtn} onClick={onDelete}>
            Delete This Account
          </button>
        </div>
      )}
    </div>
  );
};

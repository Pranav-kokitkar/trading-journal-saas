import { AccountContext } from "../../../context/AccountContext";
import { UserContext } from "../../../context/UserContext";
import { useAuth } from "../../../store/Auth";
import styles from "./myaccount.module.css";
import { useContext, useState } from "react";

export const SelectAccount = ({ accounts, createAcc }) => {
  const { authorizationToken, user, userAuthentication } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const {getUser} = useContext(UserContext);
  const { getActiveAccount, accountDetails } = useContext(AccountContext);

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
        getUser();
        getActiveAccount();
        userAuthentication();
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
        <div>
            <h3>Current Account</h3>
            <p>{user && user.activeAccountId
}</p>
        </div>
      <label>Change Account</label>
      <select value={selectedId} onChange={handleChange}>
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

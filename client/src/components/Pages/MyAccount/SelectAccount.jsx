import { useContext, useState, useEffect } from "react";
import { AccountContext } from "../../../context/AccountContext";
import { UserContext } from "../../../context/UserContext";
import { useAuth } from "../../../store/Auth";
import styles from "./selectaccount.module.css";
import { ConfirmationModal } from "../../modals/ConfirmationModal/ConfirmationModal";
import toast from "react-hot-toast";

export const SelectAccount = ({ accounts, createAcc }) => {
  const { authorizationToken, userAuthentication } = useAuth();
  const { getUser, userDetails } = useContext(UserContext);
  const { getActiveAccount, deleteAccount, getAllAccounts } =
    useContext(AccountContext);

  const [selectedId, setSelectedId] = useState("");
  const [currAccName, setCurrAccName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        toast.success("account changed");
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

  const onDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();

      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      setIsDeleteModalOpen(false);
    }
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
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete This Account?"
        message="Deleting this account will permanently remove all trades linked to it. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAccount}
      />
    </div>
  );
};

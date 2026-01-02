// src/components/CreateAccModal/CreateAccModal.jsx
import { useContext, useState } from "react";
import styles from "./CreateAccModal.module.css";
import { useAuth } from "../../../store/Auth";
import { UserContext } from "../../../context/UserContext";
import { AccountContext } from "../../../context/AccountContext";

export const CreateAccModal = ({onClose}) => {
  const { authorizationToken } = useAuth();
  const { userDetails, setUserDetails } = useContext(UserContext);

  const [form, setForm] = useState({
    name: "",
    initialCapital: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { getAllAccounts, getActiveAccount } =
    useContext(AccountContext);


  const userId = userDetails?._id;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setError("");

      if (!userId) {
        setError("User not loaded. Please try again.");
        return;
      }

      if (!form.name.trim()) {
        setError("Please enter an account name.");
        return;
      }

      if (!form.initialCapital) {
        setError("Please enter initial capital.");
        return;
      }

      const initialCapitalNumber = Number(form.initialCapital);
      if (Number.isNaN(initialCapitalNumber) || initialCapitalNumber <= 0) {
        setError("Initial capital must be a positive number.");
        return;
      }

      const payload = {
        userId,
        name: form.name.trim(),
        initialCapital: initialCapitalNumber,
        // backend will auto-set currentBalance = initialCapital
      };

      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/account`,
        {
          method: "POST",
          headers: {
            Authorization: authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create account");
      }

      // 🔥 EXPECTED: backend returns { account, user }
      const { user } = data;

      if (user) {
        // user now includes activeAccountId
        setUserDetails(user);
      }

      setForm({ name: "", initialCapital: "" });

      if (response.ok) {
        onClose();
        getActiveAccount();
        getAllAccounts();
      }
    } catch (err) {
      console.error("Error while saving account:", err);
      setError(err.message || "Something went wrong while creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createAccModal}>
      <div className={styles.container}>
        <div className={styles.headers}>
          <h3>Create Account</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className={styles.nameconatiner}>
          <label>Enter Name For Your Account</label>
          <input
            type="text"
            placeholder="Enter Name for Account"
            onChange={handleChange}
            name="name"
            value={form.name}
          />
        </div>

        <div className={styles.capitalcontainer}>
          <label>Enter Capital Amount for Your Account</label>
          <input
            type="number"
            placeholder="Enter Capital for Account"
            onChange={handleChange}
            name="initialCapital"
            value={form.initialCapital}
            min="0"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
